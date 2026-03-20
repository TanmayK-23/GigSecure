// ── Mock Data ─────────────────────────────────────────────────────────

export const MOCK_USER = {
  id: 'usr_001',
  phone: '9876543210',
  name: 'Ravi Kumar',
  vehicle_type: 'Two-Wheeler',
  avg_daily_earnings: 820,
  risk_score: 62,
  zone: 'Mumbai – Andheri West',
  created_at: '2025-03-01T00:00:00Z',
  wallet_balance: 2340,
};

export const MOCK_POLICY = {
  id: 'POL-2025-0342',
  user_id: 'usr_001',
  start_date: '2026-03-17',
  end_date: '2026-03-23',
  premium: 79,
  base_premium: 49,
  weather_loading: 24,
  zone_loading: 6,
  coverage_hours: ['09:00-22:00'],
  peak_booster: true,
  peak_hours: '18:00-21:00',
  zone_risk_score: 62,
  weather_multiplier: 1.49,
  coverage_limit: 600,
  status: 'active',
};

export const MOCK_CLAIMS = [
  {
    id: 'CLM-001',
    trigger_type: 'heavy_rain',
    trigger_time: '2026-03-19T14:30:00',
    lost_income_amount: 246,
    payout_status: 'paid',
    fraud_flag: false,
    reason: 'Heavy Rain > 25mm/h',
    zone: 'Andheri West',
    trigger_duration: '2.5 hrs',
    tx_id: 'pay_TX9283H2N',
  },
  {
    id: 'CLM-002',
    trigger_type: 'platform_outage',
    trigger_time: '2026-03-16T19:00:00',
    lost_income_amount: 123,
    payout_status: 'paid',
    fraud_flag: false,
    reason: 'Swiggy Platform Outage',
    zone: 'Andheri West',
    trigger_duration: '1.5 hrs',
    tx_id: 'pay_TX8814K3L',
  },
  {
    id: 'CLM-003',
    trigger_type: 'curfew',
    trigger_time: '2026-03-10T20:00:00',
    lost_income_amount: 328,
    payout_status: 'paid',
    fraud_flag: false,
    reason: 'Zone Curfew – Dharavi',
    zone: 'Dharavi',
    trigger_duration: '4 hrs',
    tx_id: 'pay_TX7730M4P',
  },
  {
    id: 'CLM-004',
    trigger_type: 'heavy_rain',
    trigger_time: '2026-03-05T11:20:00',
    lost_income_amount: 82,
    payout_status: 'suspicious',
    fraud_flag: true,
    reason: 'Heavy Rain (flagged)',
    zone: 'Kurla',
    trigger_duration: '1 hr',
    tx_id: null,
  },
];

export const MOCK_ADMIN_METRICS = {
  total_riders: 1284,
  active_policies: 947,
  total_payouts_week: 187430,
  premiums_collected_week: 74813,
  loss_ratio: 0.63,
  new_signups_week: 143,
  churn_rate: 0.042,
  fraud_flagged: 12,
};

export const MOCK_FRAUD_CLAIMS = [
  {
    id: 'FRD-001',
    rider: 'Suresh M.',
    phone: '98765xxxxx',
    trigger: 'Heavy Rain',
    amount: 340,
    flag_reason: 'GPS Spoofing – 82 km in 3 min',
    status: 'pending',
    time: '2026-03-19T15:10:00',
  },
  {
    id: 'FRD-002',
    rider: 'Amit K.',
    phone: '91234xxxxx',
    trigger: 'Platform Outage',
    amount: 210,
    flag_reason: 'Duplicate claim – same event',
    status: 'auto_rejected',
    time: '2026-03-18T20:05:00',
  },
  {
    id: 'FRD-003',
    rider: 'Priya S.',
    phone: '97654xxxxx',
    trigger: 'Heavy Rain',
    amount: 180,
    flag_reason: 'Weather data mismatch',
    status: 'pending',
    time: '2026-03-17T12:30:00',
  },
  {
    id: 'FRD-004',
    rider: 'Dinesh R.',
    phone: '99001xxxxx',
    trigger: 'Curfew',
    amount: 450,
    flag_reason: 'GPS Spoofing – 120 km in 2 min',
    status: 'suspended',
    time: '2026-03-15T09:00:00',
  },
];

export const MOCK_TRIGGER_EVENTS = [
  { id: 'TRG-001', type: 'heavy_rain', zone: 'Andheri West', start: '2026-03-19T14:00', end: '2026-03-19T16:30', affected: 87, severity: 'high' },
  { id: 'TRG-002', type: 'platform_outage', zone: 'Pan-Mumbai', start: '2026-03-16T19:00', end: '2026-03-16T20:30', affected: 312, severity: 'medium' },
  { id: 'TRG-003', type: 'curfew', zone: 'Dharavi', start: '2026-03-10T20:00', end: '2026-03-11T00:00', affected: 43, severity: 'high' },
  { id: 'TRG-004', type: 'heavy_rain', zone: 'Kurla', start: '2026-03-05T11:00', end: '2026-03-05T12:00', affected: 29, severity: 'medium' },
];

export const MOCK_EARNINGS_CHART = {
  labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
  payouts: [0, 246, 0, 0, 123, 328],
  premiums: [49, 59, 49, 79, 79, 79],
};

export const MOCK_PREDICTIVE_CHART = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  predicted_claims: [12, 8, 24, 18, 35, 42, 30],
  risk_level: ['low', 'low', 'medium', 'medium', 'high', 'high', 'high'],
};

export const MOCK_TRIGGER_PERFORMANCE = {
  labels: ['Heavy Rain', 'Platform Outage', 'Curfew', 'Zone Closure'],
  claims: [142, 89, 53, 28],
  payouts: [82340, 41230, 29870, 13540],
};

// Premium calculation helpers
export const calcPremium = (riskScore, peakBooster, zone) => {
  const base = 49;
  const weatherLoad = Math.round((riskScore / 100) * 30);
  const zoneLoad = zone === 'Mumbai – Andheri West' ? 6 : 4;
  const boosterLoad = peakBooster ? 12 : 0;
  const total = base + weatherLoad + zoneLoad + boosterLoad;
  return { base, weatherLoad, zoneLoad, boosterLoad, total };
};

// Simulated ML risk score
export const computeRiskScore = (data) => {
  const { avgEarnings, zone, vehicleType } = data;
  let score = 50;
  if (avgEarnings > 800) score += 10;
  if (zone?.includes('Andheri') || zone?.includes('Kurla')) score += 12;
  if (vehicleType === 'Two-Wheeler') score += 5;
  score += Math.round(Math.random() * 10 - 5);
  return Math.max(20, Math.min(95, score));
};

export const getRiskLabel = (score) => {
  if (score < 40) return { label: 'Low', cls: 'risk-low' };
  if (score < 70) return { label: 'Medium', cls: 'risk-medium' };
  return { label: 'High', cls: 'risk-high' };
};

export const TRIGGER_ICONS = {
  heavy_rain: '🌧️',
  platform_outage: '📵',
  curfew: '🚧',
  zone_closure: '🔒',
};

export const HINDI_STRINGS = {
  'Protect your daily income': 'रोज़ की कमाई सुरक्षित करें',
  'Activate Weekly Cover': 'साप्ताहिक बीमा सक्रिय करें',
  'Claim Processed': 'दावा पूर्ण हुआ',
  'Active Policy': 'सक्रिय पॉलिसी',
  'Earnings Protected': 'कमाई सुरक्षित',
};
