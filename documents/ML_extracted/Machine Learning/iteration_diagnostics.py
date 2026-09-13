"""
iteration_diagnostics.py
========================
50,000-Iteration Overfitting / Underfitting Diagnostic
=======================================================
Trains LightGBM and XGBoost with up to 50,000 boosting rounds
using early stopping, recording train vs. validation metrics at
EVERY iteration so we can see:

  - UNDERFITTING zone  : Both train & val loss are high (model too simple)
  - SWEET SPOT         : Train loss low, val loss low & stable (ideal)
  - OVERFITTING zone   : Train loss keeps falling, val loss starts rising

Outputs:
  plots/learning_curve_lgbm.png    - LightGBM 50k iteration trace
  plots/learning_curve_xgb.png     - XGBoost  50k iteration trace
  plots/bias_variance_tradeoff.png - Side-by-side comparison
  plots/training_set_size_curve.py - Classic sklearn learning curves
  iteration_results.csv            - Full numeric log of every iteration
"""

import os
import sys
import warnings
import numpy as np
import pandas as pd
import joblib
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.ticker as mtick

from sklearn.model_selection import StratifiedKFold, learning_curve
from sklearn.preprocessing import RobustScaler
from sklearn.metrics import f1_score, log_loss, roc_auc_score
import lightgbm as lgb
import xgboost as xgb

warnings.filterwarnings('ignore')

sys.path.insert(0, os.getcwd())
from feature_engineering import extract_wallet_features, assign_heuristic_labels

MAX_ROUNDS      = 50000   # maximum boosting iterations
EARLY_STOP      = 300     # stop if no val improvement for 300 rounds
LR              = 0.01    # small LR to let all 50k rounds take effect
LOG_EVERY       = 100     # record metrics every N rounds
os.makedirs('plots', exist_ok=True)


# ─────────────────────────────────────────────────────────────
# 1. LOAD DATA & FEATURES
# ─────────────────────────────────────────────────────────────
def load_data():
    print('\n[DATA] Loading raw transactions...')
    raw_df = pd.read_csv('first_order_df.csv')
    wallet_df, feature_cols = extract_wallet_features(raw_df)
    wallet_df = assign_heuristic_labels(wallet_df)

    X = wallet_df[feature_cols].values
    y = wallet_df['label'].values

    neg = (y == 0).sum()
    pos = (y == 1).sum()
    spw = neg / max(pos, 1)
    print('[DATA] Wallets: {:,}  |  Normal: {:,}  |  Exchange: {:,}  |  SPW: {:.1f}'.format(
        len(y), neg, pos, spw))

    scaler  = RobustScaler()
    X_scaled = scaler.fit_transform(X)
    return X_scaled, y, feature_cols, spw


# ─────────────────────────────────────────────────────────────
# 2. LIGHTGBM 50,000-ROUND ITERATION TRACE
# ─────────────────────────────────────────────────────────────
def run_lgbm_iterations(X, y, spw):
    print('\n' + '='*65)
    print('  LightGBM: 50,000-Round Overfitting Diagnostic')
    print('  Early stopping patience: {} rounds'.format(EARLY_STOP))
    print('='*65)

    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    fold_logs = []

    for fold, (tr_idx, va_idx) in enumerate(skf.split(X, y), 1):
        print('\n  --- Fold {} / 5 ---'.format(fold))
        X_tr, y_tr = X[tr_idx], y[tr_idx]
        X_va, y_va = X[va_idx], y[va_idx]

        dtrain = lgb.Dataset(X_tr, label=y_tr)
        dvalid = lgb.Dataset(X_va, label=y_va, reference=dtrain)

        params = {
            'objective':       'binary',
            'metric':          ['binary_logloss', 'auc'],
            'learning_rate':   LR,
            'max_depth':       4,
            'num_leaves':      15,
            'subsample':       0.8,
            'colsample_bytree':0.8,
            'reg_alpha':       1.0,
            'reg_lambda':      3.0,
            'scale_pos_weight':spw,
            'verbose':         -1,
            'seed':            42 + fold,
        }

        evals_result = {}
        callbacks = [
            lgb.early_stopping(stopping_rounds=EARLY_STOP, verbose=False),
            lgb.log_evaluation(period=-1),
            lgb.record_evaluation(evals_result),
        ]

        booster = lgb.train(
            params,
            dtrain,
            num_boost_round=MAX_ROUNDS,
            valid_sets=[dtrain, dvalid],
            valid_names=['train', 'valid'],
            callbacks=callbacks,
        )

        best_iter = booster.best_iteration
        tr_loss   = evals_result['train']['binary_logloss']
        va_loss   = evals_result['valid']['binary_logloss']
        tr_auc    = evals_result['train']['auc']
        va_auc    = evals_result['valid']['auc']
        n_iters   = len(tr_loss)

        print('  Best Iteration : {:,}'.format(best_iter))
        print('  Total Rounds   : {:,}'.format(n_iters))
        print('  Final Train Loss: {:.6f}  |  Val Loss: {:.6f}'.format(tr_loss[-1], va_loss[-1]))
        print('  Final Train AUC : {:.6f}  |  Val AUC : {:.6f}'.format(tr_auc[-1], va_auc[-1]))
        print('  Overfit Gap (Loss): {:.6f}'.format(va_loss[-1] - tr_loss[-1]))

        fold_logs.append({
            'fold':     fold,
            'n_iters':  n_iters,
            'best_iter':best_iter,
            'tr_loss':  tr_loss,
            'va_loss':  va_loss,
            'tr_auc':   tr_auc,
            'va_auc':   va_auc,
        })

    return fold_logs


# ─────────────────────────────────────────────────────────────
# 3. XGBOOST 50,000-ROUND ITERATION TRACE
# ─────────────────────────────────────────────────────────────
def run_xgb_iterations(X, y, spw):
    print('\n' + '='*65)
    print('  XGBoost: 50,000-Round Overfitting Diagnostic')
    print('  Early stopping patience: {} rounds'.format(EARLY_STOP))
    print('='*65)

    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    fold_logs = []

    for fold, (tr_idx, va_idx) in enumerate(skf.split(X, y), 1):
        print('\n  --- Fold {} / 5 ---'.format(fold))
        X_tr, y_tr = X[tr_idx], y[tr_idx]
        X_va, y_va = X[va_idx], y[va_idx]

        dtrain = xgb.DMatrix(X_tr, label=y_tr)
        dvalid = xgb.DMatrix(X_va, label=y_va)

        params = {
            'objective':        'binary:logistic',
            'eval_metric':      ['logloss', 'auc'],
            'eta':              LR,
            'max_depth':        4,
            'subsample':        0.8,
            'colsample_bytree': 0.8,
            'alpha':            1.0,
            'lambda':           3.0,
            'scale_pos_weight': spw,
            'seed':             42 + fold,
            'verbosity':        0,
        }

        evals_result = {}
        booster = xgb.train(
            params,
            dtrain,
            num_boost_round=MAX_ROUNDS,
            evals=[(dtrain, 'train'), (dvalid, 'valid')],
            evals_result=evals_result,
            early_stopping_rounds=EARLY_STOP,
            verbose_eval=False,
        )

        best_iter = booster.best_iteration
        tr_loss   = evals_result['train']['logloss']
        va_loss   = evals_result['valid']['logloss']
        tr_auc    = evals_result['train']['auc']
        va_auc    = evals_result['valid']['auc']
        n_iters   = len(tr_loss)

        print('  Best Iteration : {:,}'.format(best_iter))
        print('  Total Rounds   : {:,}'.format(n_iters))
        print('  Final Train Loss: {:.6f}  |  Val Loss: {:.6f}'.format(tr_loss[-1], va_loss[-1]))
        print('  Final Train AUC : {:.6f}  |  Val AUC : {:.6f}'.format(tr_auc[-1], va_auc[-1]))
        print('  Overfit Gap (Loss): {:.6f}'.format(va_loss[-1] - tr_loss[-1]))

        fold_logs.append({
            'fold':     fold,
            'n_iters':  n_iters,
            'best_iter':best_iter,
            'tr_loss':  tr_loss,
            'va_loss':  va_loss,
            'tr_auc':   tr_auc,
            'va_auc':   va_auc,
        })

    return fold_logs


# ─────────────────────────────────────────────────────────────
# 4. LEARNING CURVE (TRAINING SET SIZE vs SCORE)
# ─────────────────────────────────────────────────────────────
def run_sklearn_learning_curve(X, y, spw):
    print('\n[LC] Computing sklearn learning curves across training set sizes...')
    from lightgbm import LGBMClassifier

    model = LGBMClassifier(
        n_estimators=800,
        max_depth=4,
        learning_rate=0.03,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_alpha=1.0,
        reg_lambda=3.0,
        scale_pos_weight=spw,
        verbose=-1,
        random_state=42,
    )
    train_sizes = np.linspace(0.05, 1.0, 15)
    tr_sizes, tr_scores, va_scores = learning_curve(
        model, X, y,
        cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=42),
        train_sizes=train_sizes,
        scoring='f1',
        n_jobs=-1,
        verbose=0,
    )
    return tr_sizes, tr_scores, va_scores


# ─────────────────────────────────────────────────────────────
# 5. SAVE NUMERIC LOG
# ─────────────────────────────────────────────────────────────
def save_iteration_log(lgbm_logs, xgb_logs):
    rows = []
    for log in lgbm_logs:
        for i, (tl, vl, ta, va) in enumerate(
            zip(log['tr_loss'], log['va_loss'], log['tr_auc'], log['va_auc'])):
            rows.append({
                'model': 'LightGBM',
                'fold': log['fold'],
                'iteration': i + 1,
                'train_loss': tl,
                'val_loss': vl,
                'train_auc': ta,
                'val_auc': va,
                'overfit_gap_loss': vl - tl,
                'best_iteration': log['best_iter'],
            })
    for log in xgb_logs:
        for i, (tl, vl, ta, va) in enumerate(
            zip(log['tr_loss'], log['va_loss'], log['tr_auc'], log['va_auc'])):
            rows.append({
                'model': 'XGBoost',
                'fold': log['fold'],
                'iteration': i + 1,
                'train_loss': tl,
                'val_loss': vl,
                'train_auc': ta,
                'val_auc': va,
                'overfit_gap_loss': vl - tl,
                'best_iteration': log['best_iter'],
            })
    df = pd.DataFrame(rows)
    df.to_csv('iteration_results.csv', index=False)
    print('[OK] Saved: iteration_results.csv  ({:,} rows)'.format(len(df)))
    return df


# ─────────────────────────────────────────────────────────────
# 6. PLOTS
# ─────────────────────────────────────────────────────────────
ZONE_ALPHA = 0.08

def _zone_labels(ax, best_iter, max_iter):
    """Annotate underfitting / sweet spot / overfitting zones."""
    sweet_start = max(1, int(best_iter * 0.8))
    sweet_end   = min(max_iter, int(best_iter * 1.2))

    ax.axvspan(0, sweet_start, alpha=ZONE_ALPHA, color='red',    label='Underfitting zone')
    ax.axvspan(sweet_start, sweet_end, alpha=ZONE_ALPHA*2, color='green', label='Sweet spot')
    if sweet_end < max_iter:
        ax.axvspan(sweet_end, max_iter, alpha=ZONE_ALPHA, color='orange', label='Overfitting zone')
    ax.axvline(best_iter, color='green', linestyle='--', linewidth=1.5,
               label='Best iter = {:,}'.format(best_iter))


def plot_model_curves(fold_logs, model_name, out_path):
    fig, axes = plt.subplots(1, 2, figsize=(16, 6))
    fig.suptitle('{} — 50,000-Round Bias-Variance Diagnostic'.format(model_name),
                 fontsize=14, fontweight='bold')

    colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd']

    for log, c in zip(fold_logs, colors):
        iters     = list(range(1, log['n_iters'] + 1))
        best_iter = log['best_iter']

        # --- Loss curve ---
        axes[0].plot(iters, log['tr_loss'], color=c, alpha=0.55,
                     linewidth=0.8, label='Fold {} Train'.format(log['fold']))
        axes[0].plot(iters, log['va_loss'], color=c, alpha=1.0,
                     linewidth=1.6, linestyle='--', label='Fold {} Val'.format(log['fold']))

        # --- AUC curve ---
        axes[1].plot(iters, log['tr_auc'], color=c, alpha=0.55, linewidth=0.8)
        axes[1].plot(iters, log['va_auc'], color=c, alpha=1.0,
                     linewidth=1.6, linestyle='--')

    # Annotate zones using fold-1 best iter
    _zone_labels(axes[0], fold_logs[0]['best_iter'], fold_logs[0]['n_iters'])
    _zone_labels(axes[1], fold_logs[0]['best_iter'], fold_logs[0]['n_iters'])

    axes[0].set_title('Log Loss vs. Iteration\n(solid=Train, dashed=Validation)')
    axes[0].set_xlabel('Boosting Round')
    axes[0].set_ylabel('Binary Log Loss')
    axes[0].legend(fontsize=6, ncol=2)
    axes[0].grid(True, alpha=0.3)

    axes[1].set_title('ROC-AUC vs. Iteration\n(solid=Train, dashed=Validation)')
    axes[1].set_xlabel('Boosting Round')
    axes[1].set_ylabel('AUC Score')
    axes[1].grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(out_path, dpi=150)
    plt.close()
    print('[Plot] Saved: ' + out_path)


def plot_bias_variance_comparison(lgbm_logs, xgb_logs):
    fig, axes = plt.subplots(2, 2, figsize=(18, 12))
    fig.suptitle('50,000-Round Bias–Variance Tradeoff — LightGBM vs XGBoost',
                 fontsize=15, fontweight='bold')

    pairs = [
        (lgbm_logs, 'LightGBM', 'tr_loss', 'va_loss', 'Log Loss', axes[0][0]),
        (lgbm_logs, 'LightGBM', 'tr_auc',  'va_auc',  'ROC-AUC',  axes[0][1]),
        (xgb_logs,  'XGBoost',  'tr_loss', 'va_loss', 'Log Loss', axes[1][0]),
        (xgb_logs,  'XGBoost',  'tr_auc',  'va_auc',  'ROC-AUC',  axes[1][1]),
    ]
    colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd']

    for logs, mname, tr_key, va_key, metric, ax in pairs:
        # Average across folds
        min_len = min(log['n_iters'] for log in logs)
        tr_mat  = np.array([log[tr_key][:min_len] for log in logs])
        va_mat  = np.array([log[va_key][:min_len] for log in logs])

        iters    = np.arange(1, min_len + 1)
        tr_mean  = tr_mat.mean(axis=0)
        va_mean  = va_mat.mean(axis=0)
        tr_std   = tr_mat.std(axis=0)
        va_std   = va_mat.std(axis=0)

        best_iter = int(np.mean([log['best_iter'] for log in logs]))

        ax.plot(iters, tr_mean, color='#1f77b4', linewidth=1.8, label='Train Mean')
        ax.fill_between(iters, tr_mean - tr_std, tr_mean + tr_std,
                        alpha=0.15, color='#1f77b4')

        ax.plot(iters, va_mean, color='#d62728', linewidth=1.8,
                linestyle='--', label='Validation Mean')
        ax.fill_between(iters, va_mean - va_std, va_mean + va_std,
                        alpha=0.15, color='#d62728')

        _zone_labels(ax, best_iter, min_len)

        ax.set_title('{} — {} vs Iteration'.format(mname, metric))
        ax.set_xlabel('Boosting Round')
        ax.set_ylabel(metric)
        ax.legend(fontsize=8)
        ax.grid(True, alpha=0.3)

    plt.tight_layout()
    path = 'plots/bias_variance_tradeoff.png'
    plt.savefig(path, dpi=150)
    plt.close()
    print('[Plot] Saved: ' + path)


def plot_learning_curve_sizes(tr_sizes, tr_scores, va_scores):
    tr_mean = tr_scores.mean(axis=1)
    tr_std  = tr_scores.std(axis=1)
    va_mean = va_scores.mean(axis=1)
    va_std  = va_scores.std(axis=1)

    fig, ax = plt.subplots(figsize=(10, 6))
    ax.set_title('Learning Curve — Training Set Size vs F1-Score\n'
                 '(Gap between curves = Variance / Overfitting)', fontsize=13)

    ax.fill_between(tr_sizes, tr_mean - tr_std, tr_mean + tr_std, alpha=0.15, color='#1f77b4')
    ax.fill_between(tr_sizes, va_mean - va_std, va_mean + va_std, alpha=0.15, color='#d62728')

    ax.plot(tr_sizes, tr_mean, 'o-', color='#1f77b4', label='Training F1 (mean)')
    ax.plot(tr_sizes, va_mean, 's--', color='#d62728', label='Validation F1 (mean)')

    gap = tr_mean - va_mean
    ax2 = ax.twinx()
    ax2.bar(tr_sizes, gap, width=tr_sizes[1] - tr_sizes[0] if len(tr_sizes) > 1 else 0.05,
            alpha=0.2, color='purple', label='Overfit Gap (Train-Val)')
    ax2.set_ylabel('Overfit Gap', color='purple')
    ax2.tick_params(axis='y', labelcolor='purple')
    ax2.axhline(0.05, color='purple', linestyle=':', linewidth=1, label='Gap = 0.05 threshold')
    ax2.set_ylim(0, max(gap.max() * 2, 0.1))

    ax.set_xlabel('Training Set Size (# wallets)')
    ax.set_ylabel('F1-Score')
    ax.legend(loc='lower right', fontsize=9)
    ax2.legend(loc='upper right', fontsize=9)
    ax.grid(True, alpha=0.3)

    path = 'plots/training_set_size_curve.png'
    plt.tight_layout()
    plt.savefig(path, dpi=150)
    plt.close()
    print('[Plot] Saved: ' + path)


# ─────────────────────────────────────────────────────────────
# 7. FINAL SUMMARY
# ─────────────────────────────────────────────────────────────
def print_final_summary(lgbm_logs, xgb_logs):
    print('\n' + '#'*65)
    print('#  50,000-ITERATION DIAGNOSTIC SUMMARY')
    print('#'*65)

    for logs, name in [(lgbm_logs, 'LightGBM'), (xgb_logs, 'XGBoost')]:
        best_iters = [l['best_iter'] for l in logs]
        final_gaps = [l['va_loss'][-1] - l['tr_loss'][-1] for l in logs]
        final_va   = [l['va_loss'][-1] for l in logs]
        final_ta   = [l['tr_loss'][-1] for l in logs]

        print('\n  {} Results:'.format(name))
        print('  Avg Best Iteration  : {:,.0f}'.format(np.mean(best_iters)))
        print('  Std Best Iteration  : {:,.0f}'.format(np.std(best_iters)))
        print('  Avg Train Loss @ end: {:.6f}'.format(np.mean(final_ta)))
        print('  Avg Val Loss   @ end: {:.6f}'.format(np.mean(final_va)))
        print('  Avg Overfit Gap     : {:.6f}'.format(np.mean(final_gaps)))
        status = 'HEALTHY' if np.mean(final_gaps) < 0.05 else 'OVERFITTING'
        print('  Status              : {} ({})'.format(
            status,
            'Gap < 0.05' if status == 'HEALTHY' else 'Gap >= 0.05 — tune regularization'))

    print('\n  Plots saved to: plots/')
    print('  Iteration log : iteration_results.csv')
    print('#'*65 + '\n')


# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────
if __name__ == '__main__':
    X, y, feature_cols, spw = load_data()

    lgbm_logs = run_lgbm_iterations(X, y, spw)
    xgb_logs  = run_xgb_iterations(X, y, spw)

    print('\n[LC] Running sklearn learning curve (training set size analysis)...')
    tr_sizes, tr_scores, va_scores = run_sklearn_learning_curve(X, y, spw)

    print('\n[LOG] Saving full iteration log to CSV...')
    save_iteration_log(lgbm_logs, xgb_logs)

    print('\n[PLOTS] Generating all diagnostic charts...')
    plot_model_curves(lgbm_logs, 'LightGBM', 'plots/learning_curve_lgbm.png')
    plot_model_curves(xgb_logs,  'XGBoost',  'plots/learning_curve_xgb.png')
    plot_bias_variance_comparison(lgbm_logs, xgb_logs)
    plot_learning_curve_sizes(tr_sizes, tr_scores, va_scores)

    print_final_summary(lgbm_logs, xgb_logs)
