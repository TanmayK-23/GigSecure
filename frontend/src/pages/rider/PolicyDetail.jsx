import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Calendar, ChevronRight, Info, CheckCircle, Zap, Share2, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePolicy } from '../../contexts/PolicyContext';
import { useI18n } from '../../contexts/I18nContext';
import { calcPremium, TRIGGER_ICONS } from '../../utils/mockData';

/* ── Payment Sheet Modal ─────────────────────────────────────────── */
function PaymentSheet({ premium, onPay, onClose }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const pay = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setSuccess(true); setTimeout(onPay, 1500); }, 2000);
  };

  if (success) return (
    <div className="modal-overlay">
      <div className="modal-box text-center">
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <h3 className="mb-2">Payment Successful!</h3>
        <p className="text-muted mb-4">Your coverage is now active for 7 days. You're protected!</p>
        <div style={{ background: 'var(--success-bg)', border: '1px solid rgba(16,185,129,.3)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--success-light)', fontWeight: 600 }}>Policy ID: POL-2026-{Math.floor(Math.random()*9000+1000)}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h3 className="mb-4">Complete Payment</h3>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div className="flex items-center gap-2 mb-3">
            <div style={{ width: 24, height: 24, background: '#072654', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: 'white' }}>R</div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Razorpay Test Mode</span>
          </div>
          <div className="input-group mb-3">
            <label className="input-label">Card Number</label>
            <input className="input-field" placeholder="4111 1111 1111 1111" defaultValue="4111 1111 1111 1111" />
          </div>
          <div className="flex gap-3">
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label">Expiry</label>
              <input className="input-field" placeholder="12/27" defaultValue="12/27" />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label">CVV</label>
              <input className="input-field" placeholder="•••" defaultValue="123" />
            </div>
          </div>
        </div>

        <div className="flex justify-between mb-4" style={{ padding: '12px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontWeight: 600 }}>Weekly Premium</span>
          <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary-light)' }}>₹{premium}</span>
        </div>

        <button className="btn btn-primary w-full btn-lg" onClick={pay} disabled={loading}>
          {loading ? <><span className="spinner" /> Processing…</> : `Pay ₹${premium} Securely`}
        </button>
        <p className="text-center text-xs text-muted mt-3">🔒 256-bit SSL encrypted · Test mode</p>
      </div>
    </div>
  );
}

/* ── #11: Share Policy Card Modal ────────────────────────────────── */
function ShareModal({ active, premium, onClose }) {
  const [copied, setCopied] = useState(false);
  const shareText = `🛡️ I'm protected with GigSecure!\n\nPolicy: ${active.id}\nCoverage: ₹${active.coverage_limit}/day\nPremium: Just ₹${premium}/week\n\nAutomated claims, zero paperwork. Join at gigsecure.in`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h3 className="mb-4">Share Your Coverage</h3>
        <div style={{ background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))', borderRadius: 16, padding: 24, marginBottom: 20, color: 'white', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,.08)' }} />
          <div style={{ fontSize: 32, marginBottom: 8 }}>🛡️</div>
          <div style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: 4 }}>GigSecure Protected</div>
          <div style={{ opacity: 0.85, fontSize: '0.85rem', marginBottom: 16 }}>{active.id}</div>
          <div className="flex justify-between" style={{ fontSize: '0.9rem' }}>
            <div><div style={{ opacity: 0.7, fontSize: '0.7rem' }}>Coverage</div><div style={{ fontWeight: 700 }}>₹{active.coverage_limit}/day</div></div>
            <div><div style={{ opacity: 0.7, fontSize: '0.7rem' }}>Premium</div><div style={{ fontWeight: 700 }}>₹{premium}/wk</div></div>
            <div><div style={{ opacity: 0.7, fontSize: '0.7rem' }}>Claims</div><div style={{ fontWeight: 700 }}>Zero-touch</div></div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary w-full" onClick={handleCopy}>
            {copied ? <><CheckCircle size={16} /> Copied!</> : <><Share2 size={16} /> Copy to Share</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PolicyDetail() {
  const { user } = useAuth();
  const { active, purchasePolicy } = usePolicy();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [peakBooster, setPeakBooster] = useState(active?.peak_booster || false);
  const [showPayment, setShowPayment] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const riskScore = user?.risk_score || 62;
  const premium = calcPremium(riskScore, peakBooster, user?.zone || '');

  const handlePaid = () => {
    purchasePolicy({ ...active, premium: premium.total, peak_booster: peakBooster });
    setShowPayment(false);
    navigate('/rider');
  };

  const daysLeft = active ? Math.max(0, Math.round((new Date(active.end_date) - new Date()) / 86400000)) : 0;
  const daysTotal = 7;

  return (
    <div>
      <div className="page-content" style={{ maxWidth: 700 }}>
        <div className="flex justify-between items-center mb-6">
          <h2>{t('active_policy')}</h2>
          {/* #11: Share button */}
          {active && (
            <button className="btn btn-ghost btn-sm" onClick={() => setShowShare(true)}>
              <Share2 size={16} /> Share
            </button>
          )}
        </div>

        {/* Active Policy Status */}
        {active && (
          <div className="premium-card mb-6">
            <div className="flex justify-between items-center mb-3">
              <div>
                <div style={{ opacity: 0.7, fontSize: '0.8rem', marginBottom: 4 }}>Policy ID</div>
                <div style={{ fontWeight: 700 }}>{active.id}</div>
              </div>
              <div className="badge badge-success" style={{ background: 'rgba(16,185,129,.2)', color: '#fff', border: 'none' }}>Active</div>
            </div>
            <div className="divider" style={{ background: 'rgba(255,255,255,.15)' }} />
            <div className="mb-3">
              <div style={{ opacity: 0.7, fontSize: '0.75rem', marginBottom: 6 }}>{t('days_left')}</div>
              <div className="progress-bar-track" style={{ background: 'rgba(255,255,255,.15)' }}>
                <div className="progress-bar-fill" style={{ width: `${(daysLeft / daysTotal) * 100}%`, background: 'rgba(255,255,255,.8)' }} />
              </div>
              <div style={{ marginTop: 6, opacity: 0.9, fontSize: '0.875rem' }}>{daysLeft} of {daysTotal} days remaining</div>
            </div>
            <div className="flex justify-between" style={{ opacity: 0.85, fontSize: '0.8rem' }}>
              <span>Covers: {active.start_date} → {active.end_date}</span>
              <span>Max: ₹{active.coverage_limit}/day</span>
            </div>
          </div>
        )}

        {/* Premium Breakdown */}
        <div className="card mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3>This Week's Premium</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary-light)' }}>₹{premium.total}</span>
            </div>
          </div>

          {[
            { label: 'Base Premium', amount: premium.base, color: 'var(--text-secondary)' },
            { label: '🌧️ Rain Zone Loading', amount: premium.weatherLoad, color: 'var(--accent)' },
            { label: '📍 Zone Risk Loading', amount: premium.zoneLoad, color: 'var(--primary-light)' },
            ...(peakBooster ? [{ label: '⚡ Peak Hour Booster (6–9 PM)', amount: premium.boosterLoad, color: 'var(--success-light)' }] : []),
          ].map(({ label, amount, color }) => (
            <div key={label} className="flex justify-between mb-2" style={{ fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
              <span style={{ color, fontWeight: 600 }}>+₹{amount}</span>
            </div>
          ))}

          <div className="divider" />

          {/* Peak booster toggle */}
          <div className="toggle-wrapper" style={{ marginTop: 12 }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>⚡ Peak Hour Booster</div>
              <div className="text-xs text-muted">Extra cover 6–9 PM (high earnings window) · +₹12/week</div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={peakBooster} onChange={e => setPeakBooster(e.target.checked)} />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>

        {/* #5: What's Covered — all 5 triggers */}
        <div className="card mb-6">
          <h4 className="mb-3">✅ What's Covered</h4>
          {[
            { icon: '🌧️', title: 'Heavy Rain', desc: 'Rainfall > 25mm/h for 30+ min in your zone' },
            { icon: '📵', title: 'Platform Outage', desc: 'Swiggy / Blinkit down for > 15 min' },
            { icon: '🚧', title: 'Zone Curfew', desc: 'Geo-fenced area marked closed by authorities' },
            { icon: '🔥', title: 'Extreme Heat', desc: 'Temperature > 42°C — IMD Red Alert issued' },
            { icon: '🌊', title: 'Flood Alert', desc: 'Water level > 45cm at road sensors in your zone' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex gap-3 mb-3">
              <div style={{ fontSize: 20, flexShrink: 0 }}>{icon}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{title}</div>
                <div className="text-xs text-muted">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <button className="btn btn-accent w-full btn-lg" onClick={() => setShowPayment(true)}>
          {active ? `Renew – ₹${premium.total}/week` : `Activate Cover – ₹${premium.total}/week`}
        </button>
      </div>

      {showPayment && <PaymentSheet premium={premium.total} onPay={handlePaid} onClose={() => setShowPayment(false)} />}
      {showShare && <ShareModal active={active} premium={premium.total} onClose={() => setShowShare(false)} />}
    </div>
  );
}
