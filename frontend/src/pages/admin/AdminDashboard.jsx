import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, Filler, ArcElement
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Users, Shield, TrendingDown, AlertTriangle, CheckCircle, XCircle, UserX, Zap, Send, Activity, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  MOCK_TRIGGER_EVENTS, MOCK_TRIGGER_PERFORMANCE, TRIGGER_ICONS
} from '../../utils/mockData';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler, ArcElement);

const chartOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#94A3B8', font: { size: 11 } } } },
  scales: {
    x: { ticks: { color: '#94A3B8', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,.04)' } },
    y: { ticks: { color: '#94A3B8', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,.04)' } },
  },
};

/* ── #7: Trigger Control Panel ───────────────────────────────────── */
function TriggerControlPanel() {
  const [logs, setLogs] = useState([]);
  const [firing, setFiring] = useState(null);

  const fireTrigger = async (type, label) => {
    setFiring(type);
    const time = new Date().toLocaleTimeString('en-IN');
    try {
      const res = await fetch(`${BACKEND_URL}/api/triggers/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, zone: 'Andheri West', severity: 'high' }),
      });
      const data = await res.json();
      if (data.triggered) {
        setLogs(l => [{ time, type: label, status: 'success', detail: `${data.claims?.length || 0} claim(s) created` }, ...l].slice(0, 10));
      } else {
        setLogs(l => [{ time, type: label, status: 'skipped', detail: data.message || 'Already processed (idempotent)' }, ...l].slice(0, 10));
      }
    } catch {
      setLogs(l => [{ time, type: label, status: 'error', detail: 'Backend unreachable' }, ...l].slice(0, 10));
    }
    setFiring(null);
  };

  return (
    <div className="card mb-6">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h4 className="mb-1">🎮 Trigger Control Panel</h4>
          <p className="text-xs text-muted">Manually fire triggers to simulate real-world disruptions</p>
        </div>
        <span className="badge badge-primary text-xs">Live</span>
      </div>

      <div className="grid grid-3 mb-4" style={{ gap: 8 }}>
        {[
          { type: 'heavy_rain', label: '🌧️ Heavy Rain', color: 'rgba(108,71,255,.12)', border: 'rgba(108,71,255,.3)' },
          { type: 'platform_outage', label: '📵 Outage', color: 'rgba(245,158,11,.12)', border: 'rgba(245,158,11,.3)' },
          { type: 'curfew', label: '🚧 Curfew', color: 'rgba(239,68,68,.12)', border: 'rgba(239,68,68,.3)' },
          { type: 'extreme_heat', label: '🔥 Heat', color: 'rgba(239,68,68,.12)', border: 'rgba(239,68,68,.3)' },
          { type: 'flood_alert', label: '🌊 Flood', color: 'rgba(16,185,129,.12)', border: 'rgba(16,185,129,.3)' },
        ].map(({ type, label, color, border }) => (
          <button
            key={type}
            className="btn btn-sm"
            style={{ background: color, border: `1px solid ${border}`, color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.8rem', justifyContent: 'center' }}
            onClick={() => fireTrigger(type, label)}
            disabled={firing === type}
          >
            {firing === type ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Send size={12} />}
            {label}
          </button>
        ))}
      </div>

      {logs.length > 0 && (
        <div style={{ background: 'var(--bg-primary)', borderRadius: 10, padding: '10px 14px', maxHeight: 180, overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.72rem', lineHeight: 1.8 }}>
          {logs.map((log, i) => (
            <div key={i} style={{ color: log.status === 'success' ? 'var(--success-light)' : log.status === 'error' ? 'var(--danger-light)' : 'var(--text-muted)' }}>
              <span style={{ opacity: 0.6 }}>[{log.time}]</span> {log.status === 'success' ? '✅' : log.status === 'error' ? '❌' : '⏭'} {log.type} → {log.detail}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FraudTable({ rows, onAction }) {
  const statusBadge = (s) => {
    const map = {
      pending_review: 'badge-warning',
      auto_rejected: 'badge-danger',
      suspended: 'badge-danger',
      paid: 'badge-success',
      rejected: 'badge-muted',
    };
    return <span className={`badge ${map[s] || 'badge-muted'} text-xs`}>{s.replace('_', ' ')}</span>;
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="gs-table">
        <thead>
          <tr>
            <th>Rider / Claim ID</th>
            <th>Type</th>
            <th>Amount</th>
            <th>ML Fraud Signals</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id}>
              <td>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{row.user_id}</div>
                <div className="text-xs text-muted">{row.id}</div>
              </td>
              <td>
                <span className="text-sm">{row.trigger_type}</span>
                <div className="text-xs text-muted" style={{ marginTop: 2 }}>{row.zone}</div>
              </td>
              <td><span style={{ fontWeight: 700, color: 'var(--accent-light)' }}>₹{row.lost_income_amount}</span></td>
              <td>
                <div style={{ fontSize: '0.75rem', color: 'var(--danger-light)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {row.fraud_signals?.map((s, i) => <span key={i}>⚠️ {s}</span>)}
                </div>
              </td>
              <td>{statusBadge(row.payout_status)}</td>
              <td>
                {row.payout_status === 'pending_review' ? (
                  <div className="flex gap-1">
                    <button className="btn btn-sm btn-secondary" style={{ padding: '4px 10px', fontSize: '0.7rem' }} onClick={() => onAction(row.id, 'approve')} title="Approve">
                      <CheckCircle size={12} />
                    </button>
                    <button className="btn btn-sm btn-danger" style={{ padding: '4px 10px', fontSize: '0.7rem' }} onClick={() => onAction(row.id, 'reject')} title="Reject">
                      <XCircle size={12} />
                    </button>
                    <button className="btn btn-sm" style={{ padding: '4px 10px', fontSize: '0.7rem', background: 'rgba(239,68,68,.08)', color: 'var(--danger-light)', border: '1px solid rgba(239,68,68,.2)' }} onClick={() => onAction(row.id, 'suspend')} title="Suspend User">
                      <UserX size={12} />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-muted">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  
  const [m, setMetrics] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [zones, setZones] = useState([]);
  const [fraudClaims, setFraudClaims] = useState([]);
  const [fraudZoneFilter, setFraudZoneFilter] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mRes, pRes, zRes, fRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/analytics/metrics`),
          fetch(`${BACKEND_URL}/api/analytics/predictions`),
          fetch(`${BACKEND_URL}/api/analytics/zone-heatmap`),
          fetch(`${BACKEND_URL}/api/analytics/fraud-stats`)
        ]);
        setMetrics(await mRes.json());
        setPredictions(await pRes.json());
        setZones((await zRes.json()).zones || []);
        setFraudClaims((await fRes.json()).fraud_claims || []);
      } catch (err) {
        console.error("Failed loading analytics", err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000); // Live poll
    return () => clearInterval(interval);
  }, []);

  if (!m) return <div className="page-content flex justify-center items-center"><span className="spinner" /></div>;

  const lossRatioPct = Math.round(m.loss_ratio * 100);

  const topMetrics = [
    { icon: Users, label: 'Total Riders', value: m.total_riders.toLocaleString(), change: `+${m.new_signups_week} this week`, up: true },
    { icon: Shield, label: 'Active Policies', value: m.active_policies.toLocaleString(), change: 'Protected right now', up: true },
    { icon: Zap, label: 'Payouts (7d)', value: `₹${(m.total_payouts_week / 1000).toFixed(1)}K`, change: `Loss ratio: ${lossRatioPct}%`, up: false },
    { icon: AlertTriangle, label: 'Fraud Alerts', value: m.fraud_flagged.toString(), change: 'ML Detection Pipeline', up: false },
  ];

  const predictiveData = {
    labels: predictions?.predictions?.map(p => `Day ${p.day}`) || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Predicted Claims',
      data: predictions?.predictions?.map(p => p.predicted_claims) || [0,0,0,0,0,0,0],
      borderColor: '#6C47FF',
      backgroundColor: 'rgba(108,71,255,.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: predictions?.predictions?.map(p =>
        p.risk_level === 'high' ? '#EF4444' : p.risk_level === 'medium' ? '#F59E0B' : '#10B981'
      ) || '#6C47FF',
      pointRadius: 5,
    }],
  };

  const triggerPerfData = {
    labels: MOCK_TRIGGER_PERFORMANCE.labels,
    datasets: [{
      label: 'Number of Claims',
      data: MOCK_TRIGGER_PERFORMANCE.claims,
      backgroundColor: ['rgba(108,71,255,.8)', 'rgba(245,158,11,.8)', 'rgba(239,68,68,.8)', 'rgba(16,185,129,.8)'],
      borderRadius: 6,
    }],
  };

  const lossRatioData = {
    labels: ['Payouts', 'Margin'],
    datasets: [{
      data: [lossRatioPct, Math.max(0, 100 - lossRatioPct)],
      backgroundColor: ['#EF4444', 'rgba(108,71,255,.3)'],
      borderWidth: 0,
    }],
  };

  const handleFraudAction = async (id, action) => {
    try {
      await fetch(`${BACKEND_URL}/api/admin/fraud/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      // Updating UI optimistically
      setFraudClaims(prev => prev.map(c => c.id === id ? { ...c, payout_status: action === 'approve' ? 'paid' : 'rejected' } : c));
    } catch {}
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2>Admin Dashboard</h2>
          <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: 4 }}>Real-time platform health & analytics</p>
        </div>
        <div className="badge badge-primary" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>Live Data</div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-4 mb-6" style={{ gap: 16 }}>
        {topMetrics.map(({ icon: Icon, label, value, change, up }) => (
          <div key={label} className="stat-card">
            <div className="flex justify-between items-start">
              <div className="stat-label">{label}</div>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: up ? 'var(--success-bg)' : 'var(--danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color={up ? 'var(--success-light)' : 'var(--danger-light)'} />
              </div>
            </div>
            <div className="stat-value mt-2" style={{ fontSize: '1.6rem' }}>{value}</div>
            <div className={`stat-change ${up ? 'up' : 'down'}`} style={{ marginTop: 4 }}>
              {up ? '▲' : '▼'} {change}
            </div>
          </div>
        ))}
      </div>

      {/* #7: Trigger Control Panel */}
      <TriggerControlPanel />

      {/* Charts Row */}
      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card">
          <h4 className="mb-1">📈 Predictive Claim Volume – Next 7 Days</h4>
          <p className="text-xs text-muted mb-4">Based on weather forecast + historical patterns (ARIMA model)</p>
          <div style={{ height: 220 }}>
            <Line data={predictiveData} options={{ ...chartOpts, plugins: { ...chartOpts.plugins, legend: { display: false } } }} />
          </div>
        </div>
          <div className="card text-center">
          <h4 className="mb-1">💸 Weekly P&L & Loss Ratio</h4>
          <p className="text-xs text-muted mb-4">Total payouts / premiums</p>
          <div style={{ height: 160, position: 'relative', margin: '0 auto', maxWidth: 160 }}>
            <Doughnut data={lossRatioData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '75%' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: lossRatioPct > 75 ? 'var(--danger-light)' : 'var(--success-light)' }}>{lossRatioPct}%</span>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>LOSS RATIO</span>
            </div>
          </div>
          <div className="mt-3">
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              ₹{(m.total_payouts_week / 1000).toFixed(1)}K paid / ₹{(m.premiums_collected_week / 1000).toFixed(1)}K collected
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--success-light)', marginTop: 4 }}>
              Net Capital Protected: ₹{((m.premiums_collected_week - m.total_payouts_week) / 1000).toFixed(1)}K
            </div>
          </div>
        </div>
      </div>

      {/* Zone Heatmap & Exposure */}
      <div className="card mb-6">
        <h4 className="mb-1">🗺️ Granular Zone Exposure & Pricing</h4>
        <p className="text-xs text-muted mb-4">Real-time risk scoring and premium adjustments by microlocations</p>
        <div style={{ overflowX: 'auto' }}>
          <table className="gs-table" style={{ fontSize: '0.875rem' }}>
            <thead>
              <tr>
                <th>Zone Name</th>
                <th>Live Risk Score</th>
                <th>Active Coverage</th>
                <th>7-Day Triggers</th>
                <th>Avg Payout</th>
              </tr>
            </thead>
            <tbody>
              {zones.map(z => (
                <tr key={z.name}>
                  <td style={{ fontWeight: 600 }}>{z.name}</td>
                  <td>
                    <span className={`badge badge-${z.risk === 'high' ? 'danger' : z.risk === 'medium' ? 'warning' : 'success'} text-xs px-2`}>
                      {z.score}/100
                    </span>
                  </td>
                  <td>{z.active_policies} riders</td>
                  <td style={{ color: z.events_last_7d > 10 ? 'var(--danger-light)' : 'inherit' }}>{z.events_last_7d} events</td>
                  <td style={{ fontWeight: 600 }}>₹{z.avg_payout}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trigger Performance */}
      <div className="card mb-6">
        <h4 className="mb-1">⚡ Trigger Performance</h4>
        <p className="text-xs text-muted mb-4">Claims generated by trigger type (this month)</p>
        <div style={{ height: 200 }}>
          <Bar data={triggerPerfData} options={{ ...chartOpts, plugins: { ...chartOpts.plugins, legend: { display: false } } }} />
        </div>
      </div>

      {/* Fraud Pipeline */}
      <div className="card mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="mb-1">🚨 ML Fraud Detection Pipeline</h4>
            <p className="text-xs text-muted">Isolation Forest + Anomaly Scoring — Live processing telemetry vs GPS spoofers</p>
          </div>
          <div className="flex gap-3">
            <select className="input-field" style={{ padding: '4px 8px', fontSize: '0.8rem', height: 'auto', background: 'rgba(255,255,255,.05)' }} value={fraudZoneFilter} onChange={e => setFraudZoneFilter(e.target.value)}>
              <option value="All">🌍 All Zones</option>
              <option value="Andheri West">Andheri West</option>
              <option value="Kurla">Kurla</option>
              <option value="Dharavi">Dharavi</option>
              <option value="Bandra">Bandra</option>
              <option value="Powai">Powai</option>
            </select>
            <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center' }}>
              {fraudClaims.filter(f => f.payout_status === 'pending_review' && (fraudZoneFilter === 'All' || f.zone === fraudZoneFilter)).length} Pending
            </span>
          </div>
        </div>
        
        {/* Visual Pipeline */}
        <div className="flex justify-between items-center mb-6 px-4" style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: 8, gap: 8 }}>
          <div className="text-center" style={{ flex: 1 }}><Activity size={24} color="var(--primary-light)" style={{ margin: '0 auto 8px' }} /><div className="text-xs">Trigger Detected</div></div>
          <div style={{ height: 2, background: 'var(--border)', flex: 1 }} />
          <div className="text-center" style={{ flex: 1 }}><Settings size={24} color="var(--accent-light)" className="spinner" style={{ margin: '0 auto 8px', animation: 'spin 4s linear infinite' }} /><div className="text-xs">ML Telemetry Check</div></div>
          <div style={{ height: 2, background: 'var(--border)', flex: 1 }} />
          <div className="text-center" style={{ flex: 1 }}><CheckCircle size={24} color="var(--success-light)" style={{ margin: '0 auto 8px' }} /><div className="text-xs">92% Auto-Approved</div></div>
          <div style={{ height: 2, background: 'rgba(239,68,68,.3)', flex: 1 }} />
          <div className="text-center" style={{ flex: 1 }}><AlertTriangle size={24} color="var(--danger-light)" style={{ margin: '0 auto 8px' }} /><div className="text-xs">8% Flagged</div></div>
        </div>

        <FraudTable rows={fraudClaims.filter(c => fraudZoneFilter === 'All' || c.zone === fraudZoneFilter || (c.zone?.includes(fraudZoneFilter)))} onAction={handleFraudAction} />
      </div>

      {/* Recent Trigger Events */}
      <div className="card">
        <h4 className="mb-4">📋 Recent Trigger Events</h4>
        <div className="flex flex-col gap-3">
          {MOCK_TRIGGER_EVENTS.map(ev => (
            <div key={ev.id} className="flex items-center gap-3" style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: ev.severity === 'high' ? 'var(--danger-bg)' : 'var(--warning-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
              }}>
                {TRIGGER_ICONS[ev.type] || '⚡'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 2 }}>
                  {ev.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} – {ev.zone}
                </div>
                <div className="text-xs text-muted">
                  {new Date(ev.start).toLocaleDateString('en-IN')} · {ev.affected} riders affected
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span className={`badge ${ev.severity === 'high' ? 'badge-danger' : 'badge-warning'} text-xs`}>
                  {ev.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

