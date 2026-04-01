import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Zap, Clock, ChevronRight, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePolicy } from '../../contexts/PolicyContext';
import { useI18n } from '../../contexts/I18nContext';
import { getRiskLabel, TRIGGER_ICONS, calcPremium } from '../../utils/mockData';

export default function RiderHome() {
  const { user } = useAuth();
  const { active, claims, triggerInProgress, simulateTrigger, notifications, liveToast } = usePolicy();
  const { t } = useI18n();
  const navigate = useNavigate();

  const riskScore = user?.risk_score || 62;
  const risk = getRiskLabel(riskScore);
  const daysLeft = active
    ? Math.max(0, Math.round((new Date(active.end_date) - new Date()) / 86400000))
    : 0;
  const recentClaims = claims.slice(0, 3);
  const totalProtected = claims.filter(c => c.payout_status === 'paid').reduce((s, c) => s + c.lost_income_amount, 0);

  return (
    <div className="page-content">
      {/* Real-Time Claim Toast */}
      {liveToast && (
        <div style={{
          position: 'fixed',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          background: 'linear-gradient(135deg, rgba(16,185,129,.95), rgba(5,150,105,.95))',
          color: '#fff',
          borderRadius: 16,
          padding: '16px 24px',
          boxShadow: '0 8px 32px rgba(16,185,129,.4)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          animation: 'slideDown 0.4s ease-out, fadeOut 0.5s ease 4.5s forwards',
          maxWidth: 400,
          width: '90vw',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(255,255,255,.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
          }}>
            💰
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
              Payout Credited: ₹{liveToast.lost_income_amount}
            </div>
            <div style={{ opacity: 0.85, fontSize: '0.75rem', marginTop: 2 }}>
              {liveToast.reason || liveToast.trigger_type} · Zero-touch
            </div>
          </div>
        </div>
      )}

      {/* Greeting */}
      <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2>Hey, {user?.name?.split(' ')[0] || 'Rider'} 👋</h2>
          <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: 4 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className={`badge ${risk.cls}`} style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
          {risk.label} Risk Zone
        </div>
      </div>

      {/* Active Policy Card */}
      {active ? (
        <div className="premium-card mb-6 pointer" onClick={() => navigate('/rider/policy')}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <div style={{ opacity: 0.75, fontSize: '0.75rem', marginBottom: 4 }}>{t('active_policy')}</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{active.id}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ opacity: 0.75, fontSize: '0.75rem', marginBottom: 4 }}>Weekly Premium</div>
              <div style={{ fontWeight: 800, fontSize: '1.5rem' }}>₹{active.premium}</div>
            </div>
          </div>
          <div className="progress-bar-track" style={{ background: 'rgba(255,255,255,.2)', marginBottom: 8 }}>
            <div className="progress-bar-fill" style={{ width: `${(daysLeft / 7) * 100}%`, background: 'rgba(255,255,255,.9)' }} />
          </div>
          <div className="flex justify-between" style={{ opacity: 0.85, fontSize: '0.8rem' }}>
            <span>{daysLeft} days remaining</span>
            <span style={{ fontWeight: 600 }}>Renew →</span>
          </div>
        </div>
      ) : (
        <div className="card mb-6" style={{ border: '2px dashed var(--border-active)', textAlign: 'center', padding: 32 }}>
          <Shield size={40} style={{ color: 'var(--primary)', margin: '0 auto 12px' }} />
          <h4 className="mb-2">No Active Coverage</h4>
          <p className="text-muted mb-4" style={{ fontSize: '0.875rem' }}>Get protected from ₹35/week</p>
          <button className="btn btn-primary" onClick={() => navigate('/rider/policy')}>
            Activate Weekly Cover
          </button>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-3 mb-6" style={{ gap: 12 }}>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--success-light)' }}>
            <TrendingUp size={16} />
            <span className="text-xs font-semibold">Protected</span>
          </div>
          <div className="stat-value" style={{ fontSize: '1.4rem' }}>₹{totalProtected.toLocaleString('en-IN')}</div>
          <div className="stat-label">Lifetime payouts</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--primary-light)' }}>
            <Zap size={16} />
            <span className="text-xs font-semibold">Claims</span>
          </div>
          <div className="stat-value" style={{ fontSize: '1.4rem' }}>{claims.filter(c => c.payout_status === 'paid').length}</div>
          <div className="stat-label">Auto-processed</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--accent-light)' }}>
            <Clock size={16} />
            <span className="text-xs font-semibold">Avg Time</span>
          </div>
          <div className="stat-value" style={{ fontSize: '1.4rem' }}>2m</div>
          <div className="stat-label">Claim processing</div>
        </div>
      </div>

      {/* Trigger Simulation — now 5 triggers */}
      <div className="card mb-6">
        <div className="flex justify-between items-center mb-3">
          <h4>🔔 Simulate a Trigger</h4>
          <span className="badge badge-muted text-xs">Demo Mode</span>
        </div>
        <p className="text-muted mb-4" style={{ fontSize: '0.8rem' }}>
          Trigger an event to see automated zero-touch claim processing in action.
        </p>
        <div className="flex flex-col gap-2">
          {[
            { type: 'heavy_rain', label: '🌧️ Heavy Rain Event', amount: '₹246' },
            { type: 'platform_outage', label: '📵 Platform Outage', amount: '₹123' },
            { type: 'curfew', label: '🚧 Zone Curfew', amount: '₹328' },
            { type: 'extreme_heat', label: '🔥 Extreme Heat (44°C)', amount: '₹180' },
            { type: 'flood_alert', label: '🌊 Flood Alert', amount: '₹290' },
          ].map(({ type, label, amount }) => (
            <button
              key={type}
              className="btn btn-secondary"
              style={{ justifyContent: 'space-between', fontSize: '0.875rem' }}
              onClick={() => simulateTrigger(type)}
              disabled={!!triggerInProgress}
            >
              <span>{label}</span>
              <span style={{ color: 'var(--success-light)', fontWeight: 700 }}>Auto-payout {amount}</span>
            </button>
          ))}
          {triggerInProgress && (
            <div className="flex items-center gap-2 mt-2" style={{ color: 'var(--accent)', fontSize: '0.875rem' }}>
              <span className="spinner" style={{ width: 16, height: 16 }} />
              <span>Processing {triggerInProgress.type}… Payout incoming!</span>
            </div>
          )}
        </div>
      </div>

      {/* Recent Claims */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h4>Recent Claims</h4>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/rider/claims')}
            style={{ fontSize: '0.8rem' }}
          >
            View all <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {recentClaims.map(claim => (
            <div key={claim.id} className="claim-item">
              <div className="claim-icon" style={{ background: claim.fraud_flag ? 'var(--danger-bg)' : 'var(--success-bg)' }}>
                <span style={{ fontSize: 20 }}>{TRIGGER_ICONS[claim.trigger_type] || '⚡'}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{claim.reason || claim.trigger_type}</div>
                <div className="text-xs text-muted">{new Date(claim.trigger_time).toLocaleDateString('en-IN')} · {claim.zone || 'Mumbai'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: claim.fraud_flag ? 'var(--danger-light)' : 'var(--success-light)' }}>
                  {claim.fraud_flag ? '⚠️ Flagged' : `+₹${claim.lost_income_amount}`}
                </div>
                <div className={`badge ${claim.payout_status === 'paid' ? 'badge-success' : claim.payout_status === 'suspicious' ? 'badge-warning' : 'badge-muted'} text-xs`}>
                  {claim.payout_status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Educational Card */}
      <div className="card mt-6" style={{ background: 'rgba(108,71,255,.06)', border: '1px solid rgba(108,71,255,.2)' }}>
        <div className="flex gap-3">
          <AlertCircle size={20} style={{ color: 'var(--primary-light)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 4 }}>Risk Insight</div>
            <p className="text-muted" style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
              Your zone (Andheri West) had <strong style={{ color: 'var(--accent-light)' }}>2 trigger events</strong> last week.
              Heavy rain forecast for next 2 days — consider adding the peak-hour booster.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
