import sys
import os
import warnings
import numpy as np
import pandas as pd
import joblib
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from sklearn.model_selection import StratifiedKFold
from sklearn.preprocessing import RobustScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    classification_report, roc_auc_score, average_precision_score,
    f1_score, precision_score, recall_score, confusion_matrix,
    ConfusionMatrixDisplay, RocCurveDisplay, PrecisionRecallDisplay
)

warnings.filterwarnings('ignore')

# -------------------------------------------------------
# Try importing XGBoost and LightGBM (graceful fallback)
# -------------------------------------------------------
try:
    import xgboost as xgb
    HAS_XGB = True
except ImportError:
    HAS_XGB = False
    print('[WARN] xgboost not found. Will use RandomForest only.')

try:
    import lightgbm as lgb
    HAS_LGB = True
except ImportError:
    HAS_LGB = False
    print('[WARN] lightgbm not found. Will use RandomForest only.')


# --------------------------------------------------------
# BUILD MODELS DICTIONARY based on available libraries
# --------------------------------------------------------
def build_models(scale_pos_weight):
    models = {}

    models['RandomForest'] = RandomForestClassifier(
        n_estimators=300,
        max_depth=8,
        min_samples_leaf=10,
        min_samples_split=20,
        max_features='sqrt',
        class_weight={0: 1, 1: int(scale_pos_weight)},
        random_state=42,
        n_jobs=-1
    )

    if HAS_XGB:
        models['XGBoost'] = xgb.XGBClassifier(
            n_estimators=300,
            max_depth=4,
            learning_rate=0.03,
            subsample=0.8,
            colsample_bytree=0.8,
            reg_alpha=1.0,
            reg_lambda=3.0,
            scale_pos_weight=scale_pos_weight,
            eval_metric='logloss',
            use_label_encoder=False,
            verbosity=0,
            random_state=42
        )

    if HAS_LGB:
        models['LightGBM'] = lgb.LGBMClassifier(
            n_estimators=300,
            max_depth=4,
            learning_rate=0.03,
            subsample=0.8,
            colsample_bytree=0.8,
            reg_alpha=1.0,
            reg_lambda=3.0,
            scale_pos_weight=scale_pos_weight,
            verbose=-1,
            random_state=42
        )

    return models


# --------------------------------------------------------
# 5-FOLD CROSS VALIDATION + GENERALIZATION DIAGNOSTICS
# --------------------------------------------------------
def run_cross_validation(model, model_name, X_scaled, y, skf):
    oof_preds = np.zeros(len(y))
    oof_probs = np.zeros(len(y))
    train_f1s, val_f1s = [], []

    print('\n' + '='*65)
    print('  MODEL: ' + model_name)
    print('  5-Fold Stratified Cross-Validation')
    print('='*65)

    for fold, (tr_idx, va_idx) in enumerate(skf.split(X_scaled, y), 1):
        X_tr, y_tr = X_scaled[tr_idx], y[tr_idx]
        X_va, y_va = X_scaled[va_idx], y[va_idx]

        m = type(model)(**model.get_params())
        m.fit(X_tr, y_tr)

        tr_pred = m.predict(X_tr)
        va_pred = m.predict(X_va)
        va_prob = m.predict_proba(X_va)[:, 1]

        oof_preds[va_idx] = va_pred
        oof_probs[va_idx] = va_prob

        tr_f1 = f1_score(y_tr, tr_pred, zero_division=0)
        va_f1 = f1_score(y_va, va_pred, zero_division=0)
        train_f1s.append(tr_f1)
        val_f1s.append(va_f1)

        gap = tr_f1 - va_f1
        status = 'OVERFIT' if gap > 0.08 else ('UNDERFIT' if va_f1 < 0.7 else 'HEALTHY')
        print('  Fold {:d}  Train F1={:.4f}  Val F1={:.4f}  Gap={:.4f}  [{}]'.format(
            fold, tr_f1, va_f1, gap, status))

    mean_tr  = np.mean(train_f1s)
    mean_val = np.mean(val_f1s)
    std_val  = np.std(val_f1s)
    gap      = mean_tr - mean_val
    roc      = roc_auc_score(y, oof_probs)
    prauc    = average_precision_score(y, oof_probs)

    print('\n  --- OOF Summary ---')
    print('  Mean Train F1  : {:.4f}'.format(mean_tr))
    print('  Mean Val F1    : {:.4f} (+/- {:.4f})'.format(mean_val, std_val))
    print('  Overfit Gap    : {:.4f}  (Ideal < 0.05)'.format(gap))
    print('  ROC-AUC        : {:.4f}'.format(roc))
    print('  PR-AUC         : {:.4f}'.format(prauc))
    print('\n  Classification Report (OOF):')
    print(classification_report(y, oof_preds, target_names=['Normal/Transit', 'Exchange/Hub'], zero_division=0))

    return {
        'model_name': model_name,
        'mean_val_f1': mean_val,
        'std_val_f1': std_val,
        'roc_auc': roc,
        'pr_auc': prauc,
        'overfit_gap': gap,
        'oof_preds': oof_preds,
        'oof_probs': oof_probs,
    }


# --------------------------------------------------------
# SAVE PLOTS
# --------------------------------------------------------
def save_plots(results_list, y, out_dir):
    os.makedirs(out_dir, exist_ok=True)

    fig, axes = plt.subplots(1, len(results_list), figsize=(6 * len(results_list), 5))
    if len(results_list) == 1:
        axes = [axes]

    for ax, res in zip(axes, results_list):
        cm = confusion_matrix(y, res['oof_preds'])
        disp = ConfusionMatrixDisplay(cm, display_labels=['Normal', 'Exchange'])
        disp.plot(ax=ax, colorbar=False)
        ax.set_title(res['model_name'] + ' OOF Confusion Matrix')

    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, 'confusion_matrices.png'), dpi=120)
    plt.close()
    print('[Plot] Saved: confusion_matrices.png')

    fig2, ax2 = plt.subplots(figsize=(7, 5))
    for res in results_list:
        label = '{} (PR-AUC={:.3f})'.format(res['model_name'], res['pr_auc'])
        disp2 = PrecisionRecallDisplay.from_predictions(y, res['oof_probs'], name=label, ax=ax2)
    ax2.set_title('Precision-Recall Curve (Out-of-Fold)')
    ax2.legend(loc='lower left')
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, 'pr_curves.png'), dpi=120)
    plt.close()
    print('[Plot] Saved: pr_curves.png')

    fig3, ax3 = plt.subplots(figsize=(7, 5))
    for res in results_list:
        label = '{} (ROC-AUC={:.3f})'.format(res['model_name'], res['roc_auc'])
        RocCurveDisplay.from_predictions(y, res['oof_probs'], name=label, ax=ax3)
    ax3.plot([0, 1], [0, 1], 'k--')
    ax3.set_title('ROC Curve (Out-of-Fold)')
    ax3.legend(loc='lower right')
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, 'roc_curves.png'), dpi=120)
    plt.close()
    print('[Plot] Saved: roc_curves.png')


# --------------------------------------------------------
# MAIN TRAINING PIPELINE
# --------------------------------------------------------
def main():
    print('\n' + '#'*65)
    print('#  SIH ML TRAINING PIPELINE: CRYPTO EXCHANGE IDENTIFIER')
    print('#  Anti-Overfitting / Anti-Underfitting Protocol Active')
    print('#'*65 + '\n')

    sys.path.insert(0, os.getcwd())
    from feature_engineering import extract_wallet_features, assign_heuristic_labels

    print('Loading raw transactions: first_order_df.csv')
    raw_df = pd.read_csv('first_order_df.csv')
    print('  Shape: ' + str(raw_df.shape))

    wallet_df, feature_cols = extract_wallet_features(raw_df)
    wallet_df = assign_heuristic_labels(wallet_df)

    X = wallet_df[feature_cols].values
    y = wallet_df['label'].values

    neg_count = (y == 0).sum()
    pos_count = (y == 1).sum()
    scale_pos_weight = neg_count / max(pos_count, 1)
    print('\n[Class Balance]')
    print('  Negative (Normal)  : {:,}'.format(neg_count))
    print('  Positive (Exchange): {:,}'.format(pos_count))
    print('  Scale Pos Weight   : {:.2f}\n'.format(scale_pos_weight))

    print('[Scaling] Applying RobustScaler (resistant to crypto outliers)...')
    scaler = RobustScaler()
    X_scaled = scaler.fit_transform(X)

    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    all_models = build_models(scale_pos_weight)
    all_results = []

    for name, model in all_models.items():
        res = run_cross_validation(model, name, X_scaled, y, skf)
        all_results.append(res)

    print('\n' + '='*65)
    print('  MODEL COMPARISON LEADERBOARD')
    print('='*65)
    print('  {:20s} {:>12s} {:>12s} {:>12s} {:>12s}'.format(
        'Model', 'Val F1', 'ROC-AUC', 'PR-AUC', 'Gap'))
    print('  ' + '-'*62)
    best = max(all_results, key=lambda r: r['mean_val_f1'])
    for r in sorted(all_results, key=lambda x: x['mean_val_f1'], reverse=True):
        marker = ' <-- BEST' if r['model_name'] == best['model_name'] else ''
        print('  {:20s} {:>12.4f} {:>12.4f} {:>12.4f} {:>12.4f}{}'.format(
            r['model_name'], r['mean_val_f1'], r['roc_auc'], r['pr_auc'], r['overfit_gap'], marker))

    print('\n[Training] Fitting best model ({}) on full dataset...'.format(best['model_name']))
    best_model = all_models[best['model_name']]
    best_model.fit(X_scaled, y)

    print('[Saving] Persisting model artifacts...')
    joblib.dump(best_model,   'crypto_exchange_classifier.joblib')
    joblib.dump(scaler,       'feature_scaler.joblib')
    joblib.dump(feature_cols, 'feature_columns.joblib')
    wallet_df.to_csv('wallet_features.csv', index=False)

    print('[OK] Saved: crypto_exchange_classifier.joblib')
    print('[OK] Saved: feature_scaler.joblib')
    print('[OK] Saved: feature_columns.joblib')
    print('[OK] Saved: wallet_features.csv')

    print('\n[Plots] Generating diagnostic charts...')
    save_plots(all_results, y, out_dir='plots')

    print('\n' + '='*65)
    print('  TRAINING COMPLETE')
    print('  Best Model   : ' + best['model_name'])
    print('  Val F1       : {:.4f}'.format(best['mean_val_f1']))
    print('  ROC-AUC      : {:.4f}'.format(best['roc_auc']))
    print('  PR-AUC       : {:.4f}'.format(best['pr_auc']))
    print('  Overfit Gap  : {:.4f} (< 0.05 = Healthy)'.format(best['overfit_gap']))
    print('='*65 + '\n')


if __name__ == '__main__':
    main()
