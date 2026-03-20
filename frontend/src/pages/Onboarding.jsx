import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, MapPin, User, Zap, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { computeRiskScore, getRiskLabel, calcPremium } from '../utils/mockData';

const STEPS = ['Verify', 'Location', 'Profile', 'Your Risk'];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [profile, setProfile] = useState({ name: '', vehicle_type: 'Two-Wheeler', avg_daily_earnings: '' });
  const [riskData, setRiskData] = useState(null);
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  const next = () => {
    if (step === 1 && !locationGranted) return;
    if (step === 2) {
      if (!profile.name || !profile.avg_daily_earnings) return;
      setLoading(true);
      setTimeout(() => {
        const score = computeRiskScore({ ...profile, zone: 'Mumbai – Andheri West' });
        const { total } = calcPremium(score, false, 'Mumbai – Andheri West');
        setRiskData({ score, weeklyPremium: total });
        updateUser({ ...profile, avg_daily_earnings: Number(profile.avg_daily_earnings), risk_score: score });
        setLoading(false);
        setStep(3);
      }, 1800);
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

          {/* Step 0: OTP Done (already verified on landing) */}
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

          {/* Step 3: Risk Score */}
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

              <p className="text-muted mb-6" style={{ fontSize: '0.875rem', lineHeight: 1.7 }}>
                Based on your zone (Andheri West), historical weather, and delivery hours — your weekly premium is:
              </p>

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
