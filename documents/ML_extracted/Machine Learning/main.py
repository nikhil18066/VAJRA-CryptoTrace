"""
main.py
=======
SIH Project — Real-Time Identification of Fraud-Linked Cryptocurrency Exchanges
-------------------------------------------------------------------------------
MAIN ENTRY POINT — Run this file.

Usage:
    python main.py                          # runs demo with a sample address
    python main.py <suspect_wallet_address> # trace a specific address
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd

# ── Import project modules ─────────────────────────────────────────────────────
from feature_engineering import extract_wallet_features
from realtime_tracer      import build_tx_lookup, trace_suspect_wallet
from generate_lea_notice  import generate_lea_notice

# ── Model artifact paths ───────────────────────────────────────────────────────
MODEL_PATH   = 'crypto_exchange_classifier.joblib'
SCALER_PATH  = 'feature_scaler.joblib'
COLS_PATH    = 'feature_columns.joblib'
DATA_PATH    = 'first_order_df.csv'


def load_model():
    if not os.path.exists(MODEL_PATH):
        print('[ERROR] Model not found. Run train_pipeline.py first.')
        sys.exit(1)
    model        = joblib.load(MODEL_PATH)
    scaler       = joblib.load(SCALER_PATH)
    feature_cols = joblib.load(COLS_PATH)
    print('[OK] Model loaded: LightGBM | Features: {} | Scaler: RobustScaler'.format(
        len(feature_cols)))
    return model, scaler, feature_cols


def run(suspect_address=None):
    print('\n' + '='*60)
    print('  SIH CRYPTO EXCHANGE IDENTIFICATION SYSTEM')
    print('  Blockchain Fraud Analytics Engine v1.0')
    print('='*60 + '\n')

    # 1. Load model
    model, scaler, feature_cols = load_model()

    # 2. Load transactions
    print('[*] Loading blockchain transactions...')
    full_df, outbound_map = build_tx_lookup(DATA_PATH)

    # 3. Pick suspect address (CLI arg or demo)
    if suspect_address is None:
        suspect_address = list(outbound_map.keys())[42]
        print('[*] No address given. Using demo address: ' + suspect_address)

    # 4. Trace the wallet
    trace_log, exchanges = trace_suspect_wallet(
        suspect_address  = suspect_address,
        full_df          = full_df,
        outbound_map     = outbound_map,
        model            = model,
        scaler           = scaler,
        feature_cols     = feature_cols,
        max_hops         = 5,
        exchange_threshold = 0.70,
        max_nodes_per_hop  = 5,
    )

    # 5. Save trace result
    result = {
        'suspect_address'      : suspect_address,
        'total_hops_analyzed'  : len(trace_log),
        'exchanges_identified' : len(exchanges),
        'trace_log'            : trace_log,
        'identified_exchanges' : exchanges,
    }
    with open('trace_result.json', 'w') as f:
        json.dump(result, f, indent=2, default=str)
    print('\n[OK] Trace result saved: trace_result.json')

    # 6. Generate LEA freeze notice
    generate_lea_notice(
        victim_name     = 'Victim / Complainant',
        victim_address  = '0xVICTIM_ADDRESS_HERE',
        suspect_address = suspect_address,
        exchanges_found = exchanges,
        trace_log       = trace_log,
        output_path     = 'LEA_Freeze_Notice.txt',
    )

    # 7. Final summary
    print('\n' + '='*60)
    print('  RESULT SUMMARY')
    print('='*60)
    print('  Suspect Address  : ' + suspect_address)
    print('  Hops Analyzed    : ' + str(len(trace_log)))
    print('  Exchanges Found  : ' + str(len(exchanges)))
    if exchanges:
        print('\n  Identified Exchange Addresses:')
        for i, ex in enumerate(exchanges, 1):
            print('    #{} : {} (Confidence: {:.2%})'.format(
                i, ex['address'], ex.get('exchange_prob', 0)))
    print('\n  Output Files:')
    print('    trace_result.json   — Full fund flow trail')
    print('    LEA_Freeze_Notice.txt — Law enforcement freeze request')
    print('='*60 + '\n')


if __name__ == '__main__':
    addr = sys.argv[1] if len(sys.argv) > 1 else None
    run(suspect_address=addr)
