const router = require('express').Router();
const store = require('../mocks/store');

// GET /api/payouts/:claim_id
router.get('/:claim_id', (req, res) => {
  if (!store.payouts) return res.status(404).json({ error: 'Payout not found' });
  
  const receipt = store.payouts.find(p => p.claim_id === req.params.claim_id);
  if (!receipt) return res.status(404).json({ error: 'Payout not found' });
  
  res.json({ receipt });
});

// GET /api/payouts/history
router.get('/history', (req, res) => {
  const { user_id } = req.query;
  if (!store.payouts) return res.json({ payouts: [] });
  
  const history = user_id 
    ? store.payouts.filter(p => p.user_id === user_id)
    : store.payouts;
    
  res.json({ payouts: history });
});

module.exports = router;
