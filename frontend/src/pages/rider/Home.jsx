import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Zap, Clock, ChevronRight, TrendingUp, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePolicy } from '../../contexts/PolicyContext';
import { useI18n } from '../../contexts/I18nContext';
import { getRiskLabel, TRIGGER_ICONS } from '../../utils/mockData';

/* #8: Cha-ching sound (generate an oscillator beep – no external file needed) */
function playPayoutSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 — a pleasant chord
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.5);
    });
  } catch {}
}

export default function RiderHome() {
  const { user } = useAuth();
  const { active, claims, triggerInProgress, simulateTrigger, notifications, liveToast } = usePolicy();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [claimDetail, setClaimDetail] = useState(null); // #6: claim detail modal
  const [showCoins, setShowCoins] = useState(false); // #3: coin animation
  const prevToastRef = useRef(null);

  const riskScore = user?.risk_score || 62;
  const risk = getRiskLabel(riskScore);
  const daysLeft = active ? Math.max(0, Math.round((new Date(active.end_date) - new Date()) / 86400000)) : 0;
  const recentClaims = claims.slice(0, 5);
  const totalProtected = claims.filter(c => c.payout_status === 'paid').reduce((s, c) => s + c.lost_income_amount, 0);

  // #3 + #8: Trigger coin animation & sound on new toast
  useEffect(() => {
    if (liveToast && liveToast !== prevToastRef.current) {
      prevToastRef.current = liveToast;
      setShowCoins(true);
      playPayoutSound();
      setTimeout(() => setShowCoins(false), 3000);
    }
  }, [liveToast]);

  return (
    <div className="page-content">
      {/* #3: Flying coin animation */}
      {showCoins && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 9998, overflow: 'hidden' }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="coin-fly" style={{
              position: 'absolute',
              left: `${15 + Math.random() * 70}%`,
              top: '60%',
              fontSize: `${20 + Math.random() * 16}px`,
              animationDelay: `${i * 0.15}s`,
            }}>
              {['💰', '₹', '🪙', '💵'][i % 4]}
            </div>
          ))}
        </div>
      )}

      {/* Real-Time Claim Toast */}
      {liveToast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
          background: 'linear-gradient(135deg, rgba(16,185,129,.95), rgba(5,150,105,.95))',
          color: '#fff', borderRadius: 16, padding: '16px 24px',
          boxShadow: '0 8px 32px rgba(16,185,129,.4)',
          display: 'flex', alignItems: 'center', gap: 12,
          animation: 'slideDown 0.4s ease-out, fadeOut 0.5s ease 4.5s forwards',
          maxWidth: 400, width: '90vw',
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>💰</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Payout Credited: ₹{liveToast.lost_income_amount}</div>
            <div style={{ opacity: 0.85, fontSize: '0.75rem', marginTop: 2 }}>{liveToast.reason || liveToast.trigger_type} · Zero-touch</div>
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
        <div className={`badge ${risk.cls}`} style={{ fontSize: '0.8rem', padding: '6px 14px' }}>{risk.label} Risk Zone</div>
      </div>

      {/* #4: Renewal Reminder Banner */}
      {active && daysLeft <= 2 && daysLeft > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,.12), rgba(245,158,11,.06))',
          border: '1px solid rgba(245,158,11,.35)',
          borderRadius: 14, padding: '14px 18px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 12,
          animation: 'fadeUp 0.4s ease-out',
        }}>
          <div style={{ fontSize: 28 }}>⏰</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-light)' }}>Renewal Due Soon!</div>
            <div className="text-muted" style={{ fontSize: '0.78rem' }}>Only {daysLeft} day{daysLeft > 1 ? 's' : ''} left. Renew now to avoid a coverage gap.</div>
          </div>
          <button className="btn btn-accent btn-sm" onClick={() => navigate('/rider/policy')}>Renew</button>
        </div>
      )}

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
            <span style={{ fontWeight: 600 }}>View Policy →</span>
          </div>
        </div>
      ) : (
        <div className="card mb-6" style={{ border: '2px dashed var(--border-active)', textAlign: 'center', padding: 32 }}>
          <Shield size={40} style={{ color: 'var(--primary)', margin: '0 auto 12px' }} />
          <h4 className="mb-2">No Active Coverage</h4>
          <p className="text-muted mb-4" style={{ fontSize: '0.875rem' }}>Get protected from ₹35/week</p>
          <button className="btn btn-primary" onClick={() => navigate('/rider/policy')}>Activate Weekly Cover</button>
        </div>
      )}

      {/* Stats Row — #10: Skeleton loading on first render */}
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

      {/* Trigger Simulation — 5 triggers */}
      <div className="card mb-6">
        <div className="flex justify-between items-center mb-3">
          <h4>🔔 Simulate a Trigger</h4>
          <span className="badge badge-muted text-xs">Demo Mode</span>
        </div>
        <p className="text-muted mb-4" style={{ fontSize: '0.8rem' }}>Trigger an event to see automated zero-touch claim processing in action.</p>
        <div className="flex flex-col gap-2">
          {[
            { type: 'heavy_rain', label: '🌧️ Heavy Rain Event', amount: '₹246' },
            { type: 'platform_outage', label: '📵 Platform Outage', amount: '₹123' },
            { type: 'curfew', label: '🚧 Zone Curfew', amount: '₹328' },
            { type: 'extreme_heat', label: '🔥 Extreme Heat (44°C)', amount: '₹180' },
            { type: 'flood_alert', label: '🌊 Flood Alert', amount: '₹290' },
          ].map(({ type, label, amount }) => (
            <button key={type} className="btn btn-secondary" style={{ justifyContent: 'space-between', fontSize: '0.875rem' }} onClick={() => simulateTrigger(type)} disabled={!!triggerInProgress}>
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

      {/* Recent Claims — #6: Click to open detail modal */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h4>Recent Claims</h4>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/rider/claims')} style={{ fontSize: '0.8rem' }}>View all <ChevronRight size={14} /></button>
        </div>
        <div className="flex flex-col gap-2">
          {recentClaims.map(claim => (
            <div key={claim.id} className="claim-item pointer" onClick={() => setClaimDetail(claim)}>
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

      {/* Risk Insight Card */}
      <div className="card mt-6" style={{ background: 'rgba(108,71,255,.06)', border: '1px solid rgba(108,71,255,.2)' }}>
        <div className="flex gap-3">
          <AlertCircle size={20} style={{ color: 'var(--primary-light)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 4 }}>Risk Insight</div>
            <p className="text-muted" style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
              Your zone had <strong style={{ color: 'var(--accent-light)' }}>{claims.length} trigger events</strong> recently.
              {daysLeft <= 2 ? ' Renew your policy to stay protected!' : ' Heavy rain forecast for next 2 days — consider the peak-hour booster.'}
            </p>
          </div>
        </div>
      </div>

      {/* #6: Claim Detail Modal */}
      {claimDetail && (
        <div className="modal-overlay" onClick={() => setClaimDetail(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="flex justify-between items-center mb-4">
              <h3>Claim Details</h3>
              <button onClick={() => setClaimDetail(null)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div className="claim-icon" style={{ background: claimDetail.fraud_flag ? 'var(--danger-bg)' : 'var(--success-bg)', width: 56, height: 56 }}>
                <span style={{ fontSize: 28 }}>{TRIGGER_ICONS[claimDetail.trigger_type] || '⚡'}</span>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{claimDetail.reason || claimDetail.trigger_type}</div>
                <div className={`badge ${claimDetail.payout_status === 'paid' ? 'badge-success' : 'badge-warning'} mt-1`}>{claimDetail.payout_status}</div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              {[
                { label: 'Claim ID', value: claimDetail.id },
                { label: 'Trigger Type', value: claimDetail.trigger_type?.replace('_', ' ') },
                { label: 'Zone', value: claimDetail.zone || 'Mumbai' },
                { label: 'Duration', value: claimDetail.trigger_duration || '—' },
                { label: 'Time', value: new Date(claimDetail.trigger_time).toLocaleString('en-IN') },
                { label: 'Transaction ID', value: claimDetail.tx_id || 'N/A' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between" style={{ padding: '6px 0', fontSize: '0.85rem', borderBottom: '1px solid var(--border)' }}>
                  <span className="text-muted">{label}</span>
                  <span style={{ fontWeight: 600, fontFamily: label === 'Transaction ID' ? 'monospace' : 'inherit', color: label === 'Transaction ID' ? 'var(--primary-light)' : 'inherit' }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '2px solid var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Payout Amount</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--success-light)' }}>₹{claimDetail.lost_income_amount}</span>
            </div>

            {claimDetail.fraud_flag && (
              <div style={{ background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 10, padding: 12, fontSize: '0.8rem', color: 'var(--danger-light)', marginTop: 8 }}>
                ⚠️ This claim has been flagged for review by our automated fraud detection system.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
