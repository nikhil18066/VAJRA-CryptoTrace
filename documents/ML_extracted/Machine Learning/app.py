import os
import sys
import joblib
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

# Add current dir to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from feature_engineering import extract_wallet_features
from realtime_tracer import build_tx_lookup, trace_suspect_wallet, compute_wallet_features_live

app = FastAPI(title="VAJRA ML Prediction & Tracing Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables to hold model & data lookup
model = None
scaler = None
feature_cols = None
full_df = None
outbound_map = None

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'crypto_exchange_classifier.joblib')
SCALER_PATH = os.path.join(os.path.dirname(__file__), 'feature_scaler.joblib')
COLS_PATH = os.path.join(os.path.dirname(__file__), 'feature_columns.joblib')
DATA_PATH = os.path.join(os.path.dirname(__file__), 'first_order_df.csv')

@app.on_event("startup")
def startup_event():
    global model, scaler, feature_cols, full_df, outbound_map
    print("[*] Loading model artifacts...")
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    feature_cols = joblib.load(COLS_PATH)
    
    print("[*] Loading transaction dataset (this may take a few seconds)...")
    full_df, outbound_map = build_tx_lookup(DATA_PATH)
    print("[OK] Startup complete. Service ready.")

class PredictRequest(BaseModel):
    address: str

class PredictResponse(BaseModel):
    address: str
    exchange_prob: float
    prediction: str
    confidence: float

class TraceRequest(BaseModel):
    address: str
    max_hops: Optional[int] = 5
    exchange_threshold: Optional[float] = 0.70

@app.post("/predict", response_model=PredictResponse)
def predict_wallet(req: PredictRequest):
    if model is None or scaler is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    addr = req.address.strip()
    X_scaled, row_df = compute_wallet_features_live(addr, full_df, feature_cols, scaler)
    
    if X_scaled is not None:
        prob = float(model.predict_proba(X_scaled)[0][1])
        prediction = "EXCHANGE/HUB IDENTIFIED" if prob >= 0.70 else "Transit Wallet"
        confidence = float(prob if prob >= 0.50 else 1.0 - prob)
        return PredictResponse(
            address=addr,
            exchange_prob=prob,
            prediction=prediction,
            confidence=confidence
        )
    else:
        return PredictResponse(
            address=addr,
            exchange_prob=0.05,
            prediction="Transit Wallet",
            confidence=0.95
        )

@app.post("/trace")
def trace_wallet_endpoint(req: TraceRequest):
    if model is None or scaler is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
        
    addr = req.address.strip()
    
    trace_log, exchanges = trace_suspect_wallet(
        suspect_address=addr,
        full_df=full_df,
        outbound_map=outbound_map,
        model=model,
        scaler=scaler,
        feature_cols=feature_cols,
        max_hops=req.max_hops,
        exchange_threshold=req.exchange_threshold,
        max_nodes_per_hop=5
    )
    
    return {
        "suspect_address": addr,
        "total_hops_analyzed": len(trace_log),
        "exchanges_identified": len(exchanges),
        "trace_log": trace_log,
        "identified_exchanges": exchanges
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=False)
