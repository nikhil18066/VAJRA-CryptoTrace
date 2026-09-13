import os
import sys
import json
import datetime
import numpy as np
import pandas as pd
import joblib
from collections import deque

sys.path.insert(0, os.getcwd())
from feature_engineering import extract_wallet_features


# --------------------------------------------------------
# Load the trained model artifacts
# --------------------------------------------------------
def load_model_artifacts():
    if not os.path.exists('crypto_exchange_classifier.joblib'):
        print('[ERROR] Model not found. Run train_pipeline.py first.')
        sys.exit(1)
    model   = joblib.load('crypto_exchange_classifier.joblib')
    scaler  = joblib.load('feature_scaler.joblib')
    feature_cols = joblib.load('feature_columns.joblib')
    print('[OK] Model artifacts loaded successfully.')
    return model, scaler, feature_cols


# --------------------------------------------------------
# Build local transaction lookup from dataset
# --------------------------------------------------------
def build_tx_lookup(csv_path='first_order_df.csv'):
    print('[*] Building transaction lookup index from dataset...')
    df = pd.read_csv(csv_path)
    df['Value'] = pd.to_numeric(df['Value'], errors='coerce').fillna(0.0)
    df['isError'] = pd.to_numeric(df['isError'], errors='coerce').fillna(0).astype(int)
    df['TimeStamp'] = pd.to_numeric(df['TimeStamp'], errors='coerce').fillna(0).astype(int)
    df['To'] = df['To'].fillna('0x0000000000000000000000000000000000000000')

    outbound_map = {}
    for row in df.itertuples(index=False):
        sender = row.From
        if sender not in outbound_map:
            outbound_map[sender] = []
        outbound_map[sender].append({
            'TxHash':      row.TxHash,
            'To':          row.To,
            'Value':       row.Value,
            'TimeStamp':   row.TimeStamp,
            'isError':     row.isError,
            'BlockHeight': row.BlockHeight,
        })

    print('[OK] Tx lookup built. Unique senders: {:,}'.format(len(outbound_map)))
    return df, outbound_map


# --------------------------------------------------------
# Compute on-the-fly features for a single wallet
# --------------------------------------------------------
def compute_wallet_features_live(address, full_df, feature_cols, scaler):
    subset = full_df[(full_df['From'] == address) | (full_df['To'] == address)]
    if len(subset) == 0:
        return None, None

    wallet_df, _ = extract_wallet_features(subset)
    row = wallet_df[wallet_df['address'] == address]
    if row.empty:
        return None, None

    missing = [c for c in feature_cols if c not in row.columns]
    for c in missing:
        row[c] = 0.0

    X = row[feature_cols].values
    X_scaled = scaler.transform(X)
    return X_scaled, row


# --------------------------------------------------------
# BFS Multi-Hop Tracer
# --------------------------------------------------------
def trace_suspect_wallet(
    suspect_address,
    full_df,
    outbound_map,
    model,
    scaler,
    feature_cols,
    max_hops=5,
    exchange_threshold=0.70,
    max_nodes_per_hop=10
):
    print('\n' + '='*65)
    print('  MULTI-HOP BLOCKCHAIN TRACE')
    print('  Suspect Address : ' + suspect_address)
    print('  Max Hops        : ' + str(max_hops))
    print('  Exchange Thresh : ' + str(exchange_threshold))
    print('='*65)

    visited   = set()
    trace_log = []
    queue     = deque()
    queue.append((suspect_address, 0, None, 0.0, ''))

    identified_exchanges = []

    while queue:
        address, hop, parent, amount_in, tx_hash = queue.popleft()

        if address in visited or hop > max_hops:
            continue
        visited.add(address)

        print('\n  [Hop {:d}] Address: {}...{}'.format(
            hop, address[:10], address[-6:]))
        print('          Parent  : ' + (parent[:10] + '...' if parent else 'VICTIM'))
        print('          Amount  : {:.6f} ETH'.format(amount_in))

        X_scaled, row_df = compute_wallet_features_live(
            address, full_df, feature_cols, scaler)

        if X_scaled is not None:
            prob = model.predict_proba(X_scaled)[0][1]
            pred = int(prob >= exchange_threshold)

            status = 'EXCHANGE/HUB IDENTIFIED' if pred == 1 else 'Transit Wallet'
            print('          ML Prob : {:.2%}  -->  {}'.format(prob, status))

            node_info = {
                'hop':          hop,
                'address':      address,
                'parent':       parent,
                'amount_eth':   amount_in,
                'tx_hash':      tx_hash,
                'exchange_prob':prob,
                'prediction':   status,
            }
            trace_log.append(node_info)

            if pred == 1:
                identified_exchanges.append(node_info)
                print('\n  *** EXCHANGE OFF-RAMP DETECTED ***')
                print('  Address  : ' + address)
                print('  Confidence: {:.2%}'.format(prob))
                print('  At Hop   : ' + str(hop))
                print('  Amount   : {:.6f} ETH'.format(amount_in))
                continue
        else:
            print('          Status  : No on-chain data in dataset for this address')
            trace_log.append({
                'hop': hop, 'address': address, 'parent': parent,
                'amount_eth': amount_in, 'tx_hash': tx_hash,
                'exchange_prob': None, 'prediction': 'No data'
            })

        if hop < max_hops and address in outbound_map:
            outgoing = outbound_map[address]
            outgoing_sorted = sorted(outgoing, key=lambda x: x['Value'], reverse=True)
            top_out = outgoing_sorted[:max_nodes_per_hop]
            for tx in top_out:
                if tx['To'] not in visited:
                    queue.append((
                        tx['To'], hop + 1, address,
                        tx['Value'], tx['TxHash']
                    ))

    print('\n' + '='*65)
    print('  TRACE COMPLETE')
    print('  Nodes Analyzed    : ' + str(len(trace_log)))
    print('  Exchanges Found   : ' + str(len(identified_exchanges)))
    print('='*65)

    return trace_log, identified_exchanges


# --------------------------------------------------------
# MAIN
# --------------------------------------------------------
def main():
    model, scaler, feature_cols = load_model_artifacts()
    full_df, outbound_map = build_tx_lookup('first_order_df.csv')

    all_addresses = list(outbound_map.keys())
    if not all_addresses:
        print('[ERROR] No addresses found in outbound map.')
        return

    test_address = all_addresses[42]
    print('\n[Demo] Tracing suspect address: ' + test_address)

    trace_log, exchanges = trace_suspect_wallet(
        suspect_address=test_address,
        full_df=full_df,
        outbound_map=outbound_map,
        model=model,
        scaler=scaler,
        feature_cols=feature_cols,
        max_hops=5,
        exchange_threshold=0.70,
        max_nodes_per_hop=5
    )

    out_path = 'trace_result.json'
    with open(out_path, 'w') as f:
        json.dump({
            'suspect_address': test_address,
            'trace_timestamp': datetime.datetime.now().isoformat(),
            'total_hops_analyzed': len(trace_log),
            'exchanges_identified': len(exchanges),
            'trace_log': trace_log,
            'identified_exchanges': exchanges
        }, f, indent=2, default=str)
    print('\n[OK] Trace results saved: ' + out_path)


if __name__ == '__main__':
    main()
