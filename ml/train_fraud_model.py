import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report
import joblib
import os

def generate_synthetic_data(n_samples=2000):
    """
    Features: 
    0. max_speed_kmh (0-60 normal, >100 teleportation)
    1. altitude_variance (real movement changes altitude randomly)
    2. gyro_variance (real movement has jitter, 0 means simulated GPS)
    3. concurrent_claims_in_window (Syndicates file many claims together)
    4. weather_mismatch (0=match, 1=user claims rain but API says dry)
    """
    np.random.seed(42)
    
    # Normal data (85%)
    n_normal = int(n_samples * 0.85)
    normal_speed = np.clip(np.random.normal(15.0, 10.0, n_normal), 0, 70)
    normal_alt_var = np.random.normal(5.0, 2.0, n_normal)
    normal_gyro_var = np.random.normal(1.5, 0.5, n_normal)
    normal_claims = np.random.poisson(1.2, n_normal)
    normal_weather = np.random.choice([0, 0, 0, 1], size=n_normal)
    
    normal_data = np.column_stack([normal_speed, normal_alt_var, normal_gyro_var, normal_claims, normal_weather])
    normal_labels = np.zeros(n_normal)
    
    # Fraud data (15%)
    n_fraud = n_samples - n_normal
    fraud_speed = np.random.choice([15.0, 120.0, 250.0], size=n_fraud, p=[0.2, 0.6, 0.2])
    fraud_alt_var = np.random.choice([0.0, 0.05, 5.0], size=n_fraud, p=[0.5, 0.2, 0.3])
    fraud_gyro_var = np.random.choice([0.0, 0.01, 1.5], size=n_fraud, p=[0.7, 0.1, 0.2])
    fraud_claims = np.random.choice([20, 50, 1, 3], size=n_fraud, p=[0.4, 0.4, 0.1, 0.1])
    fraud_weather = np.random.choice([1, 1, 0], size=n_fraud)
    
    fraud_data = np.column_stack([fraud_speed, fraud_alt_var, fraud_gyro_var, fraud_claims, fraud_weather])
    fraud_labels = np.ones(n_fraud)
    
    X = np.r_[normal_data, fraud_data]
    y = np.r_[normal_labels, fraud_labels]
    
    return X, y

def train_and_save():
    print("Generating synthetic telemetry data (2500 samples)...")
    X, y = generate_synthetic_data(2500)
    
    print("Standardizing features...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    print("Training Isolation Forest Anomaly model...")
    # Based on expected fraud distribution
    clf = IsolationForest(n_estimators=100, contamination=0.15, random_state=42)
    clf.fit(X_scaled)
    
    preds = clf.predict(X_scaled)
    y_pred = np.where(preds == -1, 1, 0)
    
    print("\n--- Model Evaluation (Synthetic Training Set) ---")
    print(classification_report(y, y_pred, target_names=['Normal', 'Fraud']))
    
    os.makedirs('models', exist_ok=True)
    joblib.dump(clf, 'models/fraud_model.pkl')
    joblib.dump(scaler, 'models/scaler.pkl')
    print("✅ Model artifacts saved to ml/models/fraud_model.pkl and ml/models/scaler.pkl")

if __name__ == '__main__':
    train_and_save()
