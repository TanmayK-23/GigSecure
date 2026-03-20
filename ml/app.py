from flask import Flask, request, jsonify
from flask_cors import CORS
import math, random, json

app = Flask(__name__)
CORS(app)

# ── Simulated ML risk model (XGBoost-style) ────────────────────────

def compute_risk_score(data: dict) -> float:
    """
    Deterministic mock of XGBoost risk model.
    Features: avg_daily_earnings, zone, vehicle_type, rainfall_7d, disruption_hours
    Output: risk_score 0-100
    """
    score = 50.0
    
    earnings = data.get('avg_daily_earnings', 0)
    if earnings < 500: score += 15
    elif earnings > 900: score += 5
    
    zone = data.get('zone', '').lower()
    if 'andheri' in zone or 'kurla' in zone: score += 12
    elif 'bandra' in zone: score += 8
    
    rainfall = data.get('rainfall_7d_mm', 0)
    score += min(20, rainfall * 0.4)
    
    disruption_hours = data.get('disruption_hours', 0)
    score += min(15, disruption_hours * 1.5)
    
    vehicle = data.get('vehicle_type', '').lower()
    if 'two' in vehicle: score += 5
    
    return max(10, min(95, round(score, 1)))


def compute_premium_multiplier(risk_score: float) -> float:
    return round(1.0 + (risk_score / 100) * 0.8, 2)


# ── Isolation Forest mock (fraud detection) ────────────────────────

def compute_anomaly_score(locations: list) -> float:
    """
    Mock Isolation Forest on GPS location sequences.
    Detects impossible speeds (>50 km/5 min = >600 km/h).
    """
    if len(locations) < 2:
        return 0.0
    
    max_speed_kmh = 0
    for i in range(len(locations) - 1):
        p1, p2 = locations[i], locations[i+1]
        # Haversine approximation
        lat_diff = abs(p2.get('lat', 0) - p1.get('lat', 0))
        lng_diff = abs(p2.get('lng', 0) - p1.get('lng', 0))
        dist_km = math.sqrt(lat_diff**2 + lng_diff**2) * 111
        time_h = abs(p2.get('timestamp', 1) - p1.get('timestamp', 0)) / 3600
        if time_h > 0:
            speed = dist_km / time_h
            max_speed_kmh = max(max_speed_kmh, speed)
    
    # Normalise to 0-1 anomaly score (>120 km/h is suspicious for delivery)
    anomaly = min(1.0, max_speed_kmh / 500)
    return round(anomaly, 3)


# ── ARIMA-style volume prediction ──────────────────────────────────

def predict_claim_volume(weather_forecast: list, historical_avg: float = 18.0) -> list:
    """
    Mock ARIMA: next 7 days claim volume prediction.
    Higher rainfall → higher claims.
    """
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
    return jsonify({'status': 'ok', 'service': 'GigSecure ML API'})


@app.route('/predict/risk', methods=['POST'])
def predict_risk():
    data = request.get_json() or {}
    risk_score = compute_risk_score(data)
    premium_multiplier = compute_premium_multiplier(risk_score)
    base_premium = 49
    weekly_premium = round(base_premium * premium_multiplier)
    
    return jsonify({
        'risk_score': risk_score,
        'risk_label': 'high' if risk_score > 70 else 'medium' if risk_score > 40 else 'low',
        'premium_multiplier': premium_multiplier,
        'weekly_premium': weekly_premium,
        'breakdown': {
            'base': base_premium,
            'risk_loading': weekly_premium - base_premium,
        }
    })


@app.route('/predict/fraud', methods=['POST'])
def predict_fraud():
    data = request.get_json() or {}
    locations = data.get('locations', [])
    anomaly_score = compute_anomaly_score(locations)
    is_suspicious = anomaly_score > 0.4
    
    # Check duplicate claim
    claim_time = data.get('claim_time')
    trigger_id = data.get('trigger_id')
    existing_claims = data.get('existing_claim_times', [])
    is_duplicate = claim_time in existing_claims if claim_time else False
    
    return jsonify({
        'anomaly_score': anomaly_score,
        'is_suspicious': is_suspicious,
        'is_duplicate': is_duplicate,
        'fraud_type': 'gps_spoofing' if (is_suspicious and not is_duplicate) else 'duplicate' if is_duplicate else None,
        'recommendation': 'manual_review' if is_suspicious else 'auto_approve',
    })


@app.route('/predict/volume', methods=['GET', 'POST'])
def predict_volume():
    data = request.get_json() or {}
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


if __name__ == '__main__':
    app.run(debug=True, port=5001)
