const router = require('express').Router();
const store = require('../mocks/store');

// POST /api/triggers/webhook – receive external trigger events
router.post('/webhook', (req, res) => {
  const { type, zone, severity = 'medium', rainfall_mm, status } = req.body;
  
  // Evaluate trigger conditions
  let triggered = false;
  let reason = '';
  
  if (type === 'weather' && rainfall_mm > 25) {
    triggered = true;
    reason = `Heavy rain (${rainfall_mm}mm/h) in ${zone}`;
  } else if (type === 'civic' && status === 'closed') {
    triggered = true;
    reason = `Zone curfew active – ${zone}`;
  } else if (type === 'platform' && status === 'outage') {
    triggered = true;
    reason = 'Platform outage detected';
  }
  
  if (!triggered) return res.json({ triggered: false });
  
  const trigger = {
    id: 'TRG-' + Date.now(), type, zone, severity,
    start_time: new Date().toISOString(), end_time: null,
    affected_riders: Math.floor(Math.random() * 100 + 20),
    reason,
  };
  store.triggers.push(trigger);
  
  // Auto-create claims for affected riders with active policies
  const activePolicies = store.policies.filter(p => p.status === 'active');
  const createdClaims = [];
  
  for (const policy of activePolicies) {
    const user = store.users.find(u => u.id === policy.user_id);
    if (!user) continue;
    const hourlyEarnings = user.avg_daily_earnings / 8;
    const hoursDisrupted = severity === 'high' ? 3 : 1.5;
    const amount = Math.round(hourlyEarnings * hoursDisrupted);
    const claim = {
      id: 'CLM-' + Date.now(), user_id: user.id, policy_id: policy.id,
      trigger_type: type, trigger_time: new Date().toISOString(),
      lost_income_amount: amount, payout_status: 'paid', fraud_flag: false,
      tx_id: 'pay_TX' + Math.random().toString(36).slice(2, 10).toUpperCase(),
    };
    store.claims.unshift(claim);
    createdClaims.push(claim);
  }
  
  res.json({ triggered: true, trigger, claims_created: createdClaims.length, claims: createdClaims });
});

// GET /api/triggers – list all trigger events
router.get('/', (req, res) => res.json({ triggers: store.triggers }));

module.exports = router;
