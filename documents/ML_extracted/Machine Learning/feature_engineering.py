import numpy as np
import pandas as pd


def extract_wallet_features(df_tx):
    print('[1/5] Cleaning raw transaction data...')
    df = df_tx.copy()
    df['Value'] = pd.to_numeric(df['Value'], errors='coerce').fillna(0.0)
    df['isError'] = pd.to_numeric(df['isError'], errors='coerce').fillna(0).astype(int)
    df['TimeStamp'] = pd.to_numeric(df['TimeStamp'], errors='coerce').fillna(0).astype(int)
    df = df.dropna(subset=['From'])
    df['To'] = df['To'].fillna('0x0000000000000000000000000000000000000000')
    df['zero_value'] = (df['Value'] == 0).astype(int)

    print('[2/5] Aggregating INCOMING transaction features per wallet (To)...')
    in_agg = df.groupby('To').agg(
        total_eth_in=('Value', 'sum'),
        avg_eth_in=('Value', 'mean'),
        median_eth_in=('Value', 'median'),
        max_eth_in=('Value', 'max'),
        std_eth_in=('Value', 'std'),
        tx_in_count=('TxHash', 'count'),
        unique_senders=('From', 'nunique'),
        first_ts_in=('TimeStamp', 'min'),
        last_ts_in=('TimeStamp', 'max'),
        error_in_count=('isError', 'sum'),
        zero_val_in_count=('zero_value', 'sum'),
    ).fillna(0)

    print('[3/5] Aggregating OUTGOING transaction features per wallet (From)...')
    out_agg = df.groupby('From').agg(
        total_eth_out=('Value', 'sum'),
        avg_eth_out=('Value', 'mean'),
        median_eth_out=('Value', 'median'),
        max_eth_out=('Value', 'max'),
        std_eth_out=('Value', 'std'),
        tx_out_count=('TxHash', 'count'),
        unique_receivers=('To', 'nunique'),
        first_ts_out=('TimeStamp', 'min'),
        last_ts_out=('TimeStamp', 'max'),
        error_out_count=('isError', 'sum'),
        zero_val_out_count=('zero_value', 'sum'),
    ).fillna(0)

    print('[4/5] Merging and engineering derived features...')
    wallet_df = in_agg.join(out_agg, how='outer').fillna(0)
    wallet_df.index.name = 'address'
    wallet_df.reset_index(inplace=True)

    eps = 1e-9
    wallet_df['total_tx'] = wallet_df['tx_in_count'] + wallet_df['tx_out_count']
    wallet_df['total_eth_flow'] = wallet_df['total_eth_in'] + wallet_df['total_eth_out']
    wallet_df['net_flow_ratio'] = (
        (wallet_df['total_eth_in'] - wallet_df['total_eth_out']) /
        (wallet_df['total_eth_flow'] + eps)
    )
    wallet_df['in_out_tx_ratio'] = (wallet_df['tx_in_count'] + 1) / (wallet_df['tx_out_count'] + 1)
    wallet_df['degree_ratio'] = (wallet_df['unique_senders'] + 1) / (wallet_df['unique_receivers'] + 1)

    first_seen = np.where(
        wallet_df['first_ts_in'] > 0,
        wallet_df['first_ts_in'],
        wallet_df['first_ts_out']
    )
    last_seen = np.maximum(wallet_df['last_ts_in'], wallet_df['last_ts_out'])
    lifespan_secs = np.maximum(last_seen - first_seen, 1)
    wallet_df['lifespan_days'] = lifespan_secs / 86400.0
    wallet_df['tx_velocity_per_day'] = wallet_df['total_tx'] / wallet_df['lifespan_days']
    wallet_df['avg_time_between_in'] = (
        (wallet_df['last_ts_in'] - wallet_df['first_ts_in']) /
        (wallet_df['tx_in_count'] + eps)
    )
    wallet_df['avg_time_between_out'] = (
        (wallet_df['last_ts_out'] - wallet_df['first_ts_out']) /
        (wallet_df['tx_out_count'] + eps)
    )
    wallet_df['error_rate'] = (
        (wallet_df['error_in_count'] + wallet_df['error_out_count']) /
        (wallet_df['total_tx'] + eps)
    )
    wallet_df['zero_val_rate'] = (
        (wallet_df['zero_val_in_count'] + wallet_df['zero_val_out_count']) /
        (wallet_df['total_tx'] + eps)
    )
    wallet_df['in_avg_to_max_ratio'] = (wallet_df['avg_eth_in'] + eps) / (wallet_df['max_eth_in'] + eps)
    wallet_df['out_avg_to_max_ratio'] = (wallet_df['avg_eth_out'] + eps) / (wallet_df['max_eth_out'] + eps)

    print('[5/5] Applying log1p transformation for skewed monetary features...')
    raw_log_cols = [
        'total_eth_in', 'total_eth_out', 'avg_eth_in', 'avg_eth_out',
        'max_eth_in', 'max_eth_out', 'std_eth_in', 'std_eth_out',
        'unique_senders', 'unique_receivers',
        'tx_in_count', 'tx_out_count', 'total_tx', 'total_eth_flow',
        'tx_velocity_per_day', 'lifespan_days',
        'avg_time_between_in', 'avg_time_between_out',
    ]
    for col in raw_log_cols:
        wallet_df['log_' + col] = np.log1p(np.maximum(wallet_df[col], 0))

    feature_cols = [
        'log_total_eth_in', 'log_total_eth_out', 'log_avg_eth_in', 'log_avg_eth_out',
        'log_max_eth_in', 'log_max_eth_out', 'log_std_eth_in', 'log_std_eth_out',
        'log_unique_senders', 'log_unique_receivers',
        'log_tx_in_count', 'log_tx_out_count', 'log_total_tx',
        'log_tx_velocity_per_day', 'log_lifespan_days',
        'log_avg_time_between_in', 'log_avg_time_between_out',
        'net_flow_ratio', 'in_out_tx_ratio', 'degree_ratio',
        'in_avg_to_max_ratio', 'out_avg_to_max_ratio',
        'error_rate', 'zero_val_rate',
    ]

    print('\n[OK] Feature extraction complete.')
    print('     Unique wallets : ' + str(len(wallet_df)))
    print('     Feature count  : ' + str(len(feature_cols)))
    return wallet_df, feature_cols


def assign_heuristic_labels(wallet_df):
    is_exchange = (
        (wallet_df['unique_senders'] > 50) |
        (
            (wallet_df['tx_in_count'] > 100) &
            (wallet_df['unique_senders'] > 20)
        ) |
        (wallet_df['total_eth_in'] > 500) |
        (
            (wallet_df['tx_velocity_per_day'] > 5) &
            (wallet_df['unique_senders'] > 15)
        )
    ).astype(int)

    wallet_df = wallet_df.copy()
    wallet_df['label'] = is_exchange

    exchange_count = is_exchange.sum()
    normal_count = len(wallet_df) - exchange_count
    print('[Label Assignment]')
    print('  Normal / Transit wallets : ' + str(normal_count))
    print('  Exchange / Hub wallets   : ' + str(exchange_count))
    print('  Positive class ratio     : ' + str(round(exchange_count / len(wallet_df) * 100, 2)) + '%\n')
    return wallet_df


if __name__ == '__main__':
    csv_path = 'first_order_df.csv'
    print('Loading transactions from: ' + csv_path + '\n')
    raw_df = pd.read_csv(csv_path)
    wallet_df, feature_cols = extract_wallet_features(raw_df)
    wallet_df = assign_heuristic_labels(wallet_df)
    wallet_df.to_csv('wallet_features.csv', index=False)
    print('[OK] Saved: wallet_features.csv')
