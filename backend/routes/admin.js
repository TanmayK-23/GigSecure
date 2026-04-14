const router = require('express').Router();
const store = require('../mocks/store');
const { initiatePayout } = require('../services/payoutEngine');

// GET /api/admin/metrics
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

// GET /api/admin/fraud
router.get('/fraud', (req, res) => {
  const flagged = store.claims.filter(c => c.fraud_flag);
  res.json({ fraud_claims: flagged, total: flagged.length });
});

// PATCH /api/admin/fraud/:id
router.patch('/fraud/:id', (req, res) => {
  const { action } = req.body; // 'approve' | 'reject' | 'suspend'
  const claim = store.claims.find(c => c.id === req.params.id);
  if (!claim) return res.status(404).json({ error: 'Claim not found' });
  
  if (action === 'approve') {
    initiatePayout(claim, req.app.get('io')); // this handles the processing->paid lifecycle and sockets
  } else if (action === 'reject' || action === 'suspend') {
    claim.payout_status = 'rejected';
    req.app.get('io').emit('claim_rejected', claim);
  }
  res.json({ claim });
});

module.exports = router;
