from flask import Flask, request, jsonify
from flask_cors import CORS
import math, random, json
import joblib
import os
import numpy as np

app = Flask(__name__)
CORS(app)

# ── Zone Risk Profiles ──────────────────────────────────────────────
ZONE_PROFILES = {
    'andheri':  { 'base_risk': 12, 'flood_prone': True,  'avg_rainfall_mm': 38, 'label': 'Andheri West' },
    'bandra':   { 'base_risk': 8,  'flood_prone': False, 'avg_rainfall_mm': 22, 'label': 'Bandra' },
    'kurla':    { 'base_risk': 14, 'flood_prone': True,  'avg_rainfall_mm': 45, 'label': 'Kurla' },
    'dharavi':  { 'base_risk': 15, 'flood_prone': True,  'avg_rainfall_mm': 50, 'label': 'Dharavi' },
    'powai':    { 'base_risk': 6,  'flood_prone': False, 'avg_rainfall_mm': 18, 'label': 'Powai' },
}

def _match_zone(zone_str: str) -> dict:
    """Match a user-provided zone string to a known profile."""
    z = zone_str.lower()
    for key, profile in ZONE_PROFILES.items():
        if key in z:
            return profile
    return { 'base_risk': 8, 'flood_prone': False, 'avg_rainfall_mm': 20, 'label': zone_str or 'Unknown' }


FRAUD_MODEL = None
SCALER = None

def load_models():
    global FRAUD_MODEL, SCALER
    try:
        model_path = os.path.join(os.path.dirname(__file__), 'models')
        FRAUD_MODEL = joblib.load(os.path.join(model_path, 'fraud_model.pkl'))
        SCALER = joblib.load(os.path.join(model_path, 'scaler.pkl'))
        print("✅ Pre-trained Fraud Models loaded successfully")
    except Exception as e:
        print(f"⚠️ Could not load fraud models: {e}")

load_models()


# ── Modular Risk Sub-Functions ──────────────────────────────────────

def get_zone_risk(zone: str) -> float:
    """Zone-specific base risk contribution (0-15)."""
    return _match_zone(zone)['base_risk']

def get_weather_loading(zone: str, rainfall_7d_mm: float = 0) -> float:
    """Weather-based risk loading (0-20). Uses actual forecast when available."""
    profile = _match_zone(zone)
    rainfall = rainfall_7d_mm if rainfall_7d_mm > 0 else profile['avg_rainfall_mm']
    base = min(20, rainfall * 0.4)
    if profile['flood_prone']:
        base += 3
    return min(20, round(base, 1))

def get_vehicle_factor(vehicle_type: str) -> float:
    """Vehicle vulnerability factor (0-8)."""
    v = vehicle_type.lower()
    if 'bicycle' in v:
        return 8  # Most vulnerable
    elif 'two' in v:
        return 5
    elif 'three' in v:
        return 3
    return 4  # Default

def get_earnings_factor(avg_daily_earnings: float) -> float:
    """Lower earnings = higher relative risk of financial hardship (0-15)."""
    if avg_daily_earnings <= 0:
        return 10
    if avg_daily_earnings < 400:
        return 15
    elif avg_daily_earnings < 600:
        return 12
    elif avg_daily_earnings < 800:
        return 8
    elif avg_daily_earnings < 1000:
        return 5
    return 3


def compute_risk_score(data: dict) -> float:
    """
    Modular XGBoost-style risk model.
    Aggregates sub-scores from zone, weather, vehicle, and earnings factors.
    Output: risk_score 0-100
    """
    zone = data.get('zone', '')
    score = 30.0  # baseline
    score += get_zone_risk(zone)
    score += get_weather_loading(zone, data.get('rainfall_7d_mm', 0))
    score += get_vehicle_factor(data.get('vehicle_type', ''))
    score += get_earnings_factor(data.get('avg_daily_earnings', 0))
    # Disruption hours (historical)
    disruption_hours = data.get('disruption_hours', 0)
    score += min(10, disruption_hours * 1.5)
    return max(10, min(95, round(score, 1)))


# ── Dynamic Premium Calculator ─────────────────────────────────────

def compute_premium_breakdown(data: dict) -> dict:
    """
    Transparent premium breakdown.
    Returns each component so the frontend can show: Base + Zone + Weather + Vehicle = Total
    """
    zone = data.get('zone', '')
    profile = _match_zone(zone)
    risk_score = compute_risk_score(data)

    base = 35
    zone_loading = round(get_zone_risk(zone) * 0.8)           # ₹0-12
    weather_loading = round(get_weather_loading(zone, data.get('rainfall_7d_mm', 0)) * 0.7)  # ₹0-14
    vehicle_loading = round(get_vehicle_factor(data.get('vehicle_type', '')) * 0.6)           # ₹0-5
    peak_booster = 12 if data.get('peak_booster') else 0

    total = base + zone_loading + weather_loading + vehicle_loading + peak_booster

    # Savings tip based on zone
    savings_tip = None
    if not profile['flood_prone']:
        savings_tip = f"Your zone ({profile['label']}) has low flood risk — you save ₹{round(12 * 0.8 - zone_loading)} vs high-risk zones!"
    elif data.get('vehicle_type', '').lower() != 'bicycle':
        savings_tip = f"Switching to off-peak hours could save you ₹{peak_booster} per week."

    return {
        'risk_score': risk_score,
        'risk_label': 'high' if risk_score > 70 else 'medium' if risk_score > 40 else 'low',
        'base': base,
        'zone_loading': zone_loading,
        'zone_label': profile['label'],
        'weather_loading': weather_loading,
        'vehicle_loading': vehicle_loading,
        'peak_booster': peak_booster,
        'total': total,
        'savings_tip': savings_tip,
    }


# ── Isolation Forest mock (fraud detection) ────────────────────────

def extract_fraud_features(data: dict) -> np.ndarray:
    """Extract standard features from telemetry payload for Isolation Forest."""
    locations = data.get('locations', [])
    max_speed_kmh = 0
    alt_var = 0.0
    gyro_var = 0.0
    
    if len(locations) > 1:
        alts = [loc.get('alt', 5.0) for loc in locations]
        gyros = [loc.get('gyro', 1.5) for loc in locations]
        if alts: alt_var = np.var(alts)
        if gyros: gyro_var = np.var(gyros)
        
        for i in range(len(locations) - 1):
            p1, p2 = locations[i], locations[i+1]
            lat_diff = abs(p2.get('lat', 0) - p1.get('lat', 0))
            lng_diff = abs(p2.get('lng', 0) - p1.get('lng', 0))
            dist_km = math.sqrt(lat_diff**2 + lng_diff**2) * 111
            time_h = abs(p2.get('timestamp', 1) - p1.get('timestamp', 0)) / 3600
            if time_h > 0:
                speed = dist_km / time_h
                max_speed_kmh = max(max_speed_kmh, speed)
    
    concurrent_claims = data.get('concurrent_claims', 1)
    weather_mismatch = 1 if data.get('weather_mismatch') else 0
    
    return np.array([[max_speed_kmh, alt_var, gyro_var, concurrent_claims, weather_mismatch]])

def compute_anomaly_score(data: dict) -> dict:
    """
    Real ML Isolation Forest prediction.
    Features: max_speed, alt_variance, gyro_variance, concurrent_claims, weather_mismatch
    """
    if not FRAUD_MODEL or not SCALER:
        return {'score': 0.0, 'is_suspicious': False, 'signals': []}
        
    features = extract_fraud_features(data)
    features_scaled = SCALER.transform(features)
    
    # decision_function: < 0 is anomaly, > 0 is normal
    raw_score = FRAUD_MODEL.decision_function(features_scaled)[0]
    is_anomaly = FRAUD_MODEL.predict(features_scaled)[0] == -1
    
    # Map score to a 0.0 to 1.0 risk level for UI
    risk_prob = min(1.0, max(0.0, 0.5 - (raw_score * 2.0)))
    
    signals = []
    max_speed = features[0][0]
    if max_speed > 60: signals.append(f'Impossible speed: {round(max_speed)} km/h')
    if features[0][1] < 0.01: signals.append('Static altitude (GPS Spoofing likely)')
    if features[0][2] < 0.1: signals.append('No gyroscope variance (Emulator likely)')
    if features[0][3] > 10: signals.append(f'{features[0][3]} concurrent claims detected')
    if features[0][4] == 1: signals.append('Weather data mismatch')
    
    return {
        'score': round(risk_prob, 3),
        'is_suspicious': bool(is_anomaly) or len(signals) > 0,
        'signals': signals
    }

# ── ARIMA-style volume prediction ──────────────────────────────────

def predict_claim_volume(weather_forecast: list, historical_avg: float = 18.0) -> list:
    predictions = []
    for i, day in enumerate(weather_forecast[:7]):
        rainfall = day.get('rainfall_mm', 0)
        base = historical_avg
        rain_factor = 1 + (rainfall / 25) * 0.8
        trend = 1 + i * 0.03
        noise = random.uniform(0.9, 1.1)
        volume = round(base * rain_factor * trend * noise)
        predictions.append({
            'day': i + 1,
            'predicted_claims': volume,
            'risk_level': 'high' if volume > 35 else 'medium' if volume > 20 else 'low',
            'rainfall_mm': rainfall,
        })
    return predictions


# ── API Endpoints ───────────────────────────────────────────────────

@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'service': 'GigSecure ML API', 'zones': list(ZONE_PROFILES.keys())})


@app.route('/predict/risk', methods=['POST'])
def predict_risk():
    data = request.get_json(silent=True) or {}
    risk_score = compute_risk_score(data)
    return jsonify({
        'risk_score': risk_score,
        'risk_label': 'high' if risk_score > 70 else 'medium' if risk_score > 40 else 'low',
    })


@app.route('/predict/premium', methods=['POST'])
def predict_premium():
    """Dynamic premium with transparent breakdown."""
    data = request.get_json(silent=True) or {}
    breakdown = compute_premium_breakdown(data)
    return jsonify(breakdown)


@app.route('/predict/fraud/detailed', methods=['POST'])
def predict_fraud():
    data = request.get_json(silent=True) or {}
    
    # ML Prediction
    ml_result = compute_anomaly_score(data)
    
    # Simple Deduplication Logic
    claim_time = data.get('claim_time')
    existing_claims = data.get('existing_claim_times', [])
    is_duplicate = claim_time in existing_claims if claim_time else False
    
    if is_duplicate:
        ml_result['is_suspicious'] = True
        ml_result['signals'].append('Duplicate claim for same event window')

    return jsonify({
        'anomaly_score': ml_result['score'],
        'is_suspicious': ml_result['is_suspicious'],
        'signals': ml_result['signals'],
        'recommendation': 'manual_review' if ml_result['is_suspicious'] else 'auto_approve',
    })


@app.route('/predict/volume', methods=['GET', 'POST'])
def predict_volume():
    data = request.get_json(silent=True) or {}
    weather_forecast = data.get('weather_forecast', [
        {'day': i, 'rainfall_mm': random.uniform(0, 40)} for i in range(7)
    ])
    historical_avg = data.get('historical_avg', 18.0)
    predictions = predict_claim_volume(weather_forecast, historical_avg)

    return jsonify({
        'predictions': predictions,
        'total_predicted_week': sum(p['predicted_claims'] for p in predictions),
        'peak_day': max(predictions, key=lambda x: x['predicted_claims'])['day'],
    })


@app.route('/zones', methods=['GET'])
def list_zones():
    """List all available zone risk profiles for frontend dropdowns."""
    zones = []
    for key, p in ZONE_PROFILES.items():
        zones.append({
            'id': key,
            'label': p['label'],
            'base_risk': p['base_risk'],
            'flood_prone': p['flood_prone'],
        })
    return jsonify({'zones': zones})


if __name__ == '__main__':
    app.run(debug=True, port=5001)
