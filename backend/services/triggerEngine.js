/**
 * Automated Trigger Engine
 * Polls mock APIs via node-cron, evaluates parametric conditions,
 * creates claims idempotently, and emits Socket.IO events.
 */
const cron = require('node-cron');
const store = require('../mocks/store');
const {
  getWeatherData,
  getPlatformStatus,
  getCivicAlert,
  getHeatAdvisory,
  getFloodLevel,
} = require('./mockApis');

// Track processed event IDs to prevent duplicates (idempotent)
const processedEventIds = new Set();
let io = null; // Socket.IO instance, set via init()

/**
 * Generate a stable event ID from trigger data so we don't re-process.
 */
function makeEventId(type, zone, windowMinutes = 10) {
  const bucket = Math.floor(Date.now() / (windowMinutes * 60 * 1000));
  return `${type}_${zone}_${bucket}`;
}

/**
 * Process a detected trigger event.
 * Creates claims for all riders with active policies in the affected zone.
 * Emits 'new_claim' via Socket.IO.
 */
function processEvent({ type, zone, severity, reason }) {
  const eventId = makeEventId(type, zone);
  if (processedEventIds.has(eventId)) {
    return null; // Already processed — idempotent guard
  }
  processedEventIds.add(eventId);

  // Clean up old event IDs (keep last 200)
  if (processedEventIds.size > 200) {
    const arr = [...processedEventIds];
    arr.slice(0, arr.length - 200).forEach(id => processedEventIds.delete(id));
  }

  const trigger = {
    id: 'TRG-' + Date.now(),
    type,
    zone,
    severity,
    start_time: new Date().toISOString(),
    end_time: null,
    affected_riders: 0,
    reason,
  };

  // Find active policies — in production, filter by zone
  const activePolicies = store.policies.filter(p => p.status === 'active');
  const createdClaims = [];

  for (const policy of activePolicies) {
    const user = store.users.find(u => u.id === policy.user_id);
    if (!user) continue;

    const hourlyEarnings = (user.avg_daily_earnings || 800) / 8;
    const hoursDisrupted = severity === 'high' ? 3 : severity === 'medium' ? 1.5 : 1;
    const amount = Math.round(hourlyEarnings * hoursDisrupted);

    const claim = {
      id: 'CLM-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      user_id: user.id,
      policy_id: policy.id,
      trigger_type: type,
      trigger_time: new Date().toISOString(),
      lost_income_amount: amount,
      payout_status: 'paid',
      fraud_flag: false,
      reason,
      zone,
      trigger_duration: `${hoursDisrupted} hrs`,
      tx_id: 'pay_TX' + Math.random().toString(36).slice(2, 10).toUpperCase(),
    };

    store.claims.unshift(claim);
    createdClaims.push(claim);

    // Emit real-time event to connected clients
    if (io) {
      io.emit('new_claim', claim);
      io.emit('trigger_alert', { trigger, claim });
    }
  }

  trigger.affected_riders = createdClaims.length;
  store.triggers.push(trigger);

  console.log(`[TriggerEngine] ${reason} → ${createdClaims.length} claims auto-created`);
  return { trigger, claims: createdClaims };
}

/**
 * Evaluate all 5 data sources and fire triggers as needed.
 */
function evaluateAllSources() {
  const zones = ['andheri', 'bandra', 'kurla', 'dharavi', 'powai'];

  // 1. Weather check across all zones
  for (const zone of zones) {
    const weather = getWeatherData(zone);
    if (weather.alert === 'heavy_rain') {
      processEvent({
        type: 'heavy_rain',
        zone: weather.zone,
        severity: weather.rainfall_mm > 40 ? 'high' : 'medium',
        reason: `Heavy rain (${weather.rainfall_mm}mm/h) in ${weather.zone}`,
      });
    }
  }

  // 2. Platform Health
  const platform = getPlatformStatus();
  if (platform.status === 'outage') {
    processEvent({
      type: 'platform_outage',
      zone: platform.affected_zones[0] || 'Pan-Mumbai',
      severity: platform.downtime_minutes > 60 ? 'high' : 'medium',
      reason: `${platform.platform} outage detected (${platform.downtime_minutes}min)`,
    });
  }

  // 3. Civic Alert
  const civic = getCivicAlert();
  if (civic.status === 'closed') {
    processEvent({
      type: 'curfew',
      zone: civic.zone,
      severity: 'high',
      reason: `Zone curfew active – ${civic.zone}`,
    });
  }

  // 4. Heat Advisory
  const heat = getHeatAdvisory();
  if (heat.alert === 'extreme_heat') {
    processEvent({
      type: 'extreme_heat',
      zone: 'Pan-Mumbai',
      severity: 'high',
      reason: `Extreme heat (${heat.temperature_c}°C) — IMD Red Alert`,
    });
  }

  // 5. Flood Monitor
  const flood = getFloodLevel();
  if (flood.alert === 'flood_alert') {
    processEvent({
      type: 'flood_alert',
      zone: flood.zone,
      severity: 'high',
      reason: `Flood alert: ${flood.water_level_cm}cm water in ${flood.zone}`,
    });
  }
}

/**
 * Start the trigger engine cron job.
 * Runs every 30 seconds for demo purposes.
 */
function startTriggerEngine(socketIo) {
  io = socketIo;
  console.log('[TriggerEngine] Starting automated trigger polling (every 30s)...');

  // Run once immediately on startup
  evaluateAllSources();

  // Then run every 30 seconds
  cron.schedule('*/30 * * * * *', () => {
    evaluateAllSources();
  });
}

module.exports = { startTriggerEngine, processEvent, evaluateAllSources };
