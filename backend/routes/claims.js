const router = require('express').Router();
const store = require('../mocks/store');

// GET /api/claims
router.get('/', (req, res) => {
  const { user_id } = req.query;
  const claims = user_id
    ? store.claims.filter(c => c.user_id === user_id)
    : store.claims;
  res.json({ claims });
});

// POST /api/claims (internal - created by trigger engine)
router.post('/', (req, res) => {
  const { user_id, policy_id, trigger_type, lost_income_amount } = req.body;
  const claim = {
    id: 'CLM-' + Date.now(),
    user_id: user_id || 'usr_001',
    policy_id: policy_id || store.policies[0]?.id,
    trigger_type,
    trigger_time: new Date().toISOString(),
    lost_income_amount: Number(lost_income_amount),
    payout_status: 'paid',
    fraud_flag: false,
    tx_id: 'pay_TX' + Math.random().toString(36).slice(2, 10).toUpperCase(),
  };
  store.claims.unshift(claim);
  res.status(201).json({ claim });
});

module.exports = router;
