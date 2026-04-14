const router = require('express').Router();
const store = require('../mocks/store');

const ML_URL = process.env.ML_URL || 'http://localhost:5001';

// GET /api/analytics/metrics
router.get('/metrics', (req, res) => {
  const totalPremiums = store.policies.reduce((s, p) => s + (p.premium || 0), 0);
  const totalPayouts = store.claims
    .filter(c => c.payout_status === 'paid')
    .reduce((s, c) => s + c.lost_income_amount, 0);
  const fraudFlagged = store.claims.filter(c => c.fraud_flag).length;

  res.json({
    total_riders: store.users.length + 1283,
    active_policies: store.policies.filter(p => p.status === 'active').length + 946,
    total_payouts_week: totalPayouts + 187184,
    premiums_collected_week: totalPremiums + 74764,
    loss_ratio: Number(((totalPayouts + 187184) / (totalPremiums + 74764)).toFixed(2)),
    new_signups_week: 143,
    churn_rate: 0.042,
    fraud_flagged: fraudFlagged + 12,
  });
});

// GET /api/analytics/predictions
router.get('/predictions', async (req, res) => {
  try {
    const mlRes = await fetch(`${ML_URL}/predict/volume`);
    const data = await mlRes.json();
    res.json(data);
  } catch (err) {
    // Local fallback if ML is offline
    const p = [12, 8, 24, 18, 35, 42, 30];
    res.json({
      predictions: p.map((c, i) => ({
        day: i + 1, predicted_claims: c, 
        risk_level: c > 30 ? 'high' : c > 15 ? 'medium' : 'low'
      }))
    });
  }
});

// GET /api/analytics/zone-heatmap
router.get('/zone-heatmap', (req, res) => {
  res.json({
    zones: [
      { name: 'Andheri West', risk: 'high', score: 82, events_last_7d: 14, active_policies: 342, avg_payout: 246 },
      { name: 'Kurla', risk: 'high', score: 78, events_last_7d: 11, active_policies: 189, avg_payout: 220 },
      { name: 'Dharavi', risk: 'medium', score: 65, events_last_7d: 8, active_policies: 210, avg_payout: 180 },
      { name: 'Bandra', risk: 'medium', score: 55, events_last_7d: 5, active_policies: 120, avg_payout: 150 },
      { name: 'Powai', risk: 'low', score: 32, events_last_7d: 2, active_policies: 86, avg_payout: 90 },
    ]
  });
});

// GET /api/analytics/fraud-stats
router.get('/fraud-stats', (req, res) => {
  const flagged = store.claims.filter(c => c.fraud_flag);
  res.json({ fraud_claims: flagged, total: flagged.length });
});

module.exports = router;
