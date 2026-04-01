import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, MapPin, User, Zap, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getRiskLabel } from '../utils/mockData';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const STEPS = ['Verify', 'Location', 'Profile', 'Your Risk'];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [profile, setProfile] = useState({ name: '', vehicle_type: 'Two-Wheeler', avg_daily_earnings: '' });
  const [riskData, setRiskData] = useState(null);
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  const fetchPremium = async (profileData) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/policies/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zone: 'Mumbai – Andheri West',
          vehicle_type: profileData.vehicle_type,
          avg_daily_earnings: Number(profileData.avg_daily_earnings),
          peak_booster: false,
        }),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Onboarding] Backend unreachable, using fallback pricing');
      // Local fallback
      const score = 62;
      return {
        risk_score: score,
        risk_label: 'medium',
        base: 35,
        zone_loading: 10,
        weather_loading: 8,
        vehicle_loading: 3,
        peak_booster: 0,
        total: 56,
        savings_tip: null,
      };
    }
  };

  const next = async () => {
    if (step === 1 && !locationGranted) return;
    if (step === 2) {
      if (!profile.name || !profile.avg_daily_earnings) return;
      setLoading(true);
      const breakdown = await fetchPremium(profile);
      setRiskData({
        score: breakdown.risk_score || 62,
        weeklyPremium: breakdown.total,
        breakdown,
      });
      updateUser({
        ...profile,
        avg_daily_earnings: Number(profile.avg_daily_earnings),
        risk_score: breakdown.risk_score || 62,
      });
      setLoading(false);
      setStep(3);
      return;
    }
    if (step === 3) { navigate('/rider'); return; }
    setStep(s => s + 1);
  };

  const risk = riskData ? getRiskLabel(riskData.score) : null;

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,var(--primary),var(--primary-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🛡️</div>
          <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>GigSecure</span>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center mb-8" style={{ gap: 0 }}>
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div className={`step-dot ${i < step ? 'done' : i === step ? 'active' : 'inactive'}`}>
                  {i < step ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span style={{ fontSize: '0.625rem', color: i === step ? 'var(--primary-light)' : 'var(--text-muted)', fontWeight: 500 }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: 40, height: 1, background: i < step ? 'var(--primary)' : 'var(--border)', margin: '0 4px', marginBottom: 18 }} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="card animate-fade-up" style={{ padding: 32 }}>

          {/* Step 0: OTP Done */}
          {step === 0 && (
            <div className="text-center">
              <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
              <h3 className="mb-2">Phone Verified!</h3>
              <p className="text-muted mb-6" style={{ fontSize: '0.875rem' }}>Your number has been verified. Let's set up your profile to get a personalised risk score.</p>
              <button className="btn btn-primary w-full btn-lg" onClick={next}>
                Continue <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* Step 1: Location */}
          {step === 1 && (
            <div className="text-center">
              <div style={{ fontSize: 56, marginBottom: 16 }}>📍</div>
              <h3 className="mb-2">Share Your Location</h3>
              <p className="text-muted mb-6" style={{ fontSize: '0.875rem' }}>
                We use your delivery zone's historical weather and traffic data to calculate your premium accurately.
              </p>
              {!locationGranted ? (
                <button
                  className="btn btn-secondary w-full btn-lg mb-4"
                  onClick={() => {
                    setLoading(true);
                    setTimeout(() => { setLocationGranted(true); setLoading(false); }, 1200);
                  }}
                  disabled={loading}
                >
                  <MapPin size={18} />
                  {loading ? 'Getting location…' : 'Grant Location Access'}
                </button>
              ) : (
                <div style={{ background: 'var(--success-bg)', border: '1px solid rgba(16,185,129,.3)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                  <div className="flex items-center gap-2 justify-center" style={{ color: 'var(--success-light)' }}>
                    <CheckCircle size={18} />
                    <span style={{ fontWeight: 600 }}>Location detected: Mumbai – Andheri West</span>
                  </div>
                </div>
              )}
              <button className="btn btn-primary w-full btn-lg" onClick={next} disabled={!locationGranted}>
                Continue <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* Step 2: Profile */}
          {step === 2 && (
            <div>
              <h3 className="mb-2">Tell us about yourself</h3>
              <p className="text-muted mb-6" style={{ fontSize: '0.875rem' }}>This helps us calculate your exact income protection.</p>

              <div className="flex flex-col gap-4">
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <input
                    className="input-field"
                    placeholder="e.g. Ravi Kumar"
                    value={profile.name}
                    onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Vehicle Type</label>
                  <select
                    className="input-field"
                    value={profile.vehicle_type}
                    onChange={e => setProfile(p => ({ ...p, vehicle_type: e.target.value }))}
                    style={{ background: 'var(--bg-secondary)' }}
                  >
                    <option value="Two-Wheeler">Two-Wheeler</option>
                    <option value="Bicycle">Bicycle</option>
                    <option value="Three-Wheeler">Three-Wheeler</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Average Daily Earnings (₹)</label>
                  <input
                    className="input-field"
                    placeholder="e.g. 820"
                    type="number"
                    value={profile.avg_daily_earnings}
                    onChange={e => setProfile(p => ({ ...p, avg_daily_earnings: e.target.value }))}
                  />
                </div>
              </div>

              <button
                className="btn btn-primary w-full btn-lg mt-6"
                onClick={next}
                disabled={loading || !profile.name || !profile.avg_daily_earnings}
              >
                {loading ? (
                  <><span className="spinner" /> Calculating Risk Score…</>
                ) : (
                  <>Get My Risk Score <Zap size={18} /></>
                )}
              </button>
            </div>
          )}

          {/* Step 3: Risk Score + Premium Breakdown */}
          {step === 3 && riskData && (
            <div className="text-center">
              <p className="text-muted mb-3" style={{ fontSize: '0.875rem' }}>Your AI-powered risk profile</p>
              <h3 className="mb-4">Risk Assessment Complete</h3>

              {/* Score ring */}
              <div style={{
                width: 120, height: 120, borderRadius: '50%', margin: '0 auto 20px',
                background: `conic-gradient(var(--primary) ${riskData.score * 3.6}deg, var(--bg-secondary) 0deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}>
                <div style={{
                  width: 90, height: 90, borderRadius: '50%',
                  background: 'var(--bg-card)', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-light)' }}>{riskData.score}</span>
                  <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>/ 100</span>
                </div>
              </div>

              <div className={`badge ${risk.cls} mb-4`} style={{ fontSize: '0.875rem', padding: '6px 16px' }}>
                {risk.label} Risk Zone
              </div>

              {/* Premium Breakdown Card */}
              {riskData.breakdown && (
                <div style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 16,
                  textAlign: 'left',
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Premium Breakdown
                  </div>
                  {[
                    { label: 'Base Coverage', value: riskData.breakdown.base },
                    { label: `Zone Loading (${riskData.breakdown.zone_label || 'Zone'})`, value: riskData.breakdown.zone_loading },
                    { label: 'Weather Loading', value: riskData.breakdown.weather_loading },
                    { label: 'Vehicle Factor', value: riskData.breakdown.vehicle_loading },
                    ...(riskData.breakdown.peak_booster > 0 ? [{ label: 'Peak Booster', value: riskData.breakdown.peak_booster }] : []),
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between" style={{ padding: '5px 0', fontSize: '0.85rem', borderBottom: '1px solid var(--border)' }}>
                      <span className="text-muted">{item.label}</span>
                      <span style={{ fontWeight: 600 }}>₹{item.value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between" style={{ padding: '8px 0 0', fontSize: '1rem', fontWeight: 800 }}>
                    <span>Weekly Total</span>
                    <span style={{ color: 'var(--primary-light)' }}>₹{riskData.weeklyPremium}</span>
                  </div>
                </div>
              )}

              {/* Savings tip */}
              {riskData.breakdown?.savings_tip && (
                <div style={{
                  background: 'rgba(16,185,129,.08)',
                  border: '1px solid rgba(16,185,129,.25)',
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 16,
                  fontSize: '0.8rem',
                  color: 'var(--success-light)',
                }}>
                  💡 {riskData.breakdown.savings_tip}
                </div>
              )}

              <div className="premium-card" style={{ borderRadius: 16, padding: 24, marginBottom: 24 }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>₹{riskData.weeklyPremium}</div>
                <div style={{ opacity: 0.8, fontSize: '0.875rem' }}>/ week · Fully automated cover</div>
              </div>

              <button className="btn btn-accent w-full btn-lg" onClick={next}>
                Activate My Cover 🚀
              </button>
            </div>
          )}
        </div>

        {/* Back button */}
        {step > 0 && step < 3 && (
          <button
            className="btn btn-ghost btn-sm mt-4"
            onClick={() => setStep(s => s - 1)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, margin: '16px auto 0' }}
          >
            <ChevronLeft size={16} /> Back
          </button>
        )}
      </div>
    </div>
  );
}
