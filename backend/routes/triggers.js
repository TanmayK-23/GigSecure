const router = require('express').Router();
const store = require('../mocks/store');
const { processEvent } = require('../services/triggerEngine');

// POST /api/triggers/webhook – receive external trigger events
router.post('/webhook', (req, res) => {
  const { type, zone, severity = 'medium', rainfall_mm, status } = req.body;

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

  const result = processEvent({
    type: type === 'weather' ? 'heavy_rain' : type === 'civic' ? 'curfew' : 'platform_outage',
    zone: zone || 'Pan-Mumbai',
    severity,
    reason,
  });

  res.json({ triggered: true, ...result });
});

// POST /api/triggers/simulate – Admin dashboard manual trigger
router.post('/simulate', (req, res) => {
  const { type, zone, severity = 'high' } = req.body;

  const reasons = {
    heavy_rain: `Heavy rain (38mm/h) in ${zone || 'Andheri West'}`,
    platform_outage: `Swiggy Instamart outage detected`,
    curfew: `Zone curfew active – ${zone || 'Dharavi'}`,
    extreme_heat: `Extreme heat (44°C) — IMD Red Alert`,
    flood_alert: `Flood alert: 55cm water in ${zone || 'Kurla'}`,
  };

  const result = processEvent({
    type,
    zone: zone || 'Andheri West',
    severity,
    reason: reasons[type] || `${type} trigger simulated`,
  });

  if (!result) {
    return res.json({ triggered: false, message: 'Event already processed (idempotent guard)' });
  }

  res.json({ triggered: true, ...result });
});

// GET /api/triggers – list all trigger events
router.get('/', (req, res) => res.json({ triggers: store.triggers }));

module.exports = router;
