// ── In-memory data store ────────────────────────────────────────────
const store = {
  users: [
    {
      id: 'usr_001', phone: '9876543210', name: 'Ravi Kumar',
      vehicle_type: 'Two-Wheeler', avg_daily_earnings: 820,
      risk_score: 62, zone: 'Mumbai – Andheri West',
      created_at: '2025-03-01T00:00:00Z',
    }
  ],
  policies: [
    {
      id: 'POL-2025-0342', user_id: 'usr_001',
      start_date: '2026-03-17', end_date: '2026-03-23',
      premium: 79, base_premium: 49, weather_loading: 24,
      coverage_hours: ['09:00-22:00'], peak_booster: true,
      zone_risk_score: 62, weather_multiplier: 1.49,
      coverage_limit: 600, status: 'active',
    }
  ],
  claims: [
    { id: 'CLM-001', user_id: 'usr_001', policy_id: 'POL-2025-0342', trigger_type: 'heavy_rain', trigger_time: '2026-03-19T14:30:00', lost_income_amount: 246, payout_status: 'paid', fraud_flag: false, tx_id: 'pay_TX9283H2N' },
    { id: 'CLM-002', user_id: 'usr_001', policy_id: 'POL-2025-0342', trigger_type: 'platform_outage', trigger_time: '2026-03-16T19:00:00', lost_income_amount: 123, payout_status: 'paid', fraud_flag: false, tx_id: 'pay_TX8814K3L' },
    { id: 'CLM-003', user_id: 'usr_001', policy_id: 'POL-2025-0342', trigger_type: 'curfew', trigger_time: '2026-03-10T20:00:00', lost_income_amount: 328, payout_status: 'paid', fraud_flag: false, tx_id: 'pay_TX7730M4P' },
  ],
  triggers: [
    { id: 'TRG-001', type: 'heavy_rain', zone: 'Andheri West', start_time: '2026-03-19T14:00', end_time: '2026-03-19T16:30', affected_riders: 87, severity: 'high' },
  ],
};

module.exports = store;
