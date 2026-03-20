const router = require('express').Router();
const store = require('../mocks/store');

// POST /api/policies/quote
router.post('/quote', (req, res) => {
  const { risk_score = 60, peak_booster = false, zone = '' } = req.body;
  const base = 49;
  const weatherLoad = Math.round((risk_score / 100) * 30);
  const zoneLoad = zone.includes('Andheri') ? 6 : 4;
  const boosterLoad = peak_booster ? 12 : 0;
  const total = base + weatherLoad + zoneLoad + boosterLoad;
  res.json({ base, weatherLoad, zoneLoad, boosterLoad, total, weekly_premium: total });
});

// POST /api/policies
router.post('/', (req, res) => {
  const { user_id, premium, peak_booster, coverage_hours } = req.body;
  const now = new Date();
  const end = new Date(now.getTime() + 7 * 86400000);
  const policy = {
    id: 'POL-' + Date.now(),
    user_id: user_id || 'usr_001',
    start_date: now.toISOString().slice(0, 10),
    end_date: end.toISOString().slice(0, 10),
    premium, peak_booster, coverage_hours,
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
