from flask import Flask, request, jsonify
from flask_cors import CORS
import math, random, json

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
        lat_diff = abs(p2.get('lat', 0) - p1.get('lat', 0))
        lng_diff = abs(p2.get('lng', 0) - p1.get('lng', 0))
        dist_km = math.sqrt(lat_diff**2 + lng_diff**2) * 111
        time_h = abs(p2.get('timestamp', 1) - p1.get('timestamp', 0)) / 3600
        if time_h > 0:
            speed = dist_km / time_h
            max_speed_kmh = max(max_speed_kmh, speed)

    anomaly = min(1.0, max_speed_kmh / 500)
    return round(anomaly, 3)


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
    data = request.get_json() or {}
    risk_score = compute_risk_score(data)
    return jsonify({
        'risk_score': risk_score,
        'risk_label': 'high' if risk_score > 70 else 'medium' if risk_score > 40 else 'low',
    })


@app.route('/predict/premium', methods=['POST'])
def predict_premium():
    """Dynamic premium with transparent breakdown."""
    data = request.get_json() or {}
    breakdown = compute_premium_breakdown(data)
    return jsonify(breakdown)


@app.route('/predict/fraud', methods=['POST'])
def predict_fraud():
    data = request.get_json() or {}
    locations = data.get('locations', [])
    anomaly_score = compute_anomaly_score(locations)
    is_suspicious = anomaly_score > 0.4

    claim_time = data.get('claim_time')
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
