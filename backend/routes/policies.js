const router = require('express').Router();
const store = require('../mocks/store');

const ML_URL = process.env.ML_URL || 'http://localhost:5001';

// POST /api/policies/quote — dynamic premium from ML service
router.post('/quote', async (req, res) => {
  const { risk_score = 60, peak_booster = false, zone = '', vehicle_type = 'Two-Wheeler', avg_daily_earnings = 800 } = req.body;

  try {
    // Call ML /predict/premium for a transparent breakdown
    const mlRes = await fetch(`${ML_URL}/predict/premium`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zone, vehicle_type, avg_daily_earnings, peak_booster }),
    });
    const breakdown = await mlRes.json();
    return res.json(breakdown);
  } catch (err) {
    // Fallback to local calculation if ML is unreachable
    console.warn('[policies/quote] ML unreachable, using fallback:', err.message);
    const base = 35;
    const weatherLoad = Math.round((risk_score / 100) * 14);
    const zoneLoad = zone.toLowerCase().includes('andheri') ? 10 : zone.toLowerCase().includes('kurla') ? 11 : 6;
    const vehicleLoad = vehicle_type.toLowerCase().includes('two') ? 3 : 2;
    const boosterLoad = peak_booster ? 12 : 0;
    const total = base + weatherLoad + zoneLoad + vehicleLoad + boosterLoad;
    return res.json({
      risk_score, risk_label: 'medium',
      base, zone_loading: zoneLoad, weather_loading: weatherLoad,
      vehicle_loading: vehicleLoad, peak_booster: boosterLoad,
      total, savings_tip: null,
    });
  }
});

// POST /api/policies
router.post('/', (req, res) => {
  const { user_id, premium, peak_booster, coverage_hours, breakdown } = req.body;
  const now = new Date();
  const end = new Date(now.getTime() + 7 * 86400000);
  const policy = {
    id: 'POL-' + Date.now(),
    user_id: user_id || 'usr_001',
    start_date: now.toISOString().slice(0, 10),
    end_date: end.toISOString().slice(0, 10),
    premium, peak_booster, coverage_hours,
    breakdown: breakdown || null,
    zone_risk_score: 62, weather_multiplier: 1.49,
    coverage_limit: 600, status: 'active',
  };
  store.policies.push(policy);
  res.status(201).json({ policy, tx_id: 'pay_' + Math.random().toString(36).slice(2, 12).toUpperCase() });
});

// GET /api/policies/active
router.get('/active', (req, res) => {
  const active = store.policies.find(p => p.status === 'active') || null;
  res.json({ policy: active });
});

// GET /api/policies
router.get('/', (req, res) => res.json({ policies: store.policies }));

module.exports = router;
