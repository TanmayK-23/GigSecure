import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Cloud, Zap, CheckCircle, ArrowRight, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';

/* ── OTP Modal ─────────────────────────────────────────────────────── */
function OtpModal({ phone, onVerify, onClose }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(true);

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) {
      document.getElementById(`otp-${i + 1}`)?.focus();
    }
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      document.getElementById(`otp-${i - 1}`)?.focus();
    }
  };

  const verify = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onVerify(); }, 1200);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-4">
          <div style={{ fontSize: 48, marginBottom: 8 }}>📱</div>
          <h3>Verify Your Number</h3>
          <p className="text-muted mt-2" style={{ fontSize: '0.875rem' }}>
            OTP sent to +91 {phone}. <strong style={{ color: 'var(--primary-light)' }}>Use 123456</strong>
          </p>
        </div>

        <div className="otp-grid mb-4">
          {otp.map((v, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              className="otp-input"
              maxLength={1}
              value={v}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
            />
          ))}
        </div>

        <button
          className="btn btn-primary w-full btn-lg"
          onClick={verify}
          disabled={loading || otp.join('').length < 6}
        >
          {loading ? <span className="spinner" /> : 'Verify & Continue'}
        </button>
        <p className="text-center text-xs text-muted mt-3">Didn't receive? Resend in 30s</p>
      </div>
    </div>
  );
}

/* ── Landing Page ──────────────────────────────────────────────────── */
export default function Landing() {
  const [phone, setPhone] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const { login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const handleSendOtp = () => {
    if (phone.length < 10) return;
    setShowOtp(true);
  };

  const handleVerified = () => {
    login(phone, false);
    navigate('/onboarding');
  };

  const handleAdminLogin = () => {
    login('admin', true);
    navigate('/admin');
  };

  const features = [
    { icon: Cloud, title: 'Weather Protection', desc: 'Auto-payout when heavy rain halts deliveries', color: '#6C47FF' },
    { icon: Zap, title: 'Zero Clicks Claims', desc: 'Triggers detected automatically, money in wallet', color: '#F59E0B' },
    { icon: Shield, title: 'Platform Outage Cover', desc: 'Get paid when Swiggy/Blinkit goes down', color: '#10B981' },
  ];

  const stats = [
    { value: '₹49', label: 'Starting weekly premium' },
    { value: '2 min', label: 'Avg claim processing time' },
    { value: '1,284', label: 'Riders protected' },
  ];

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-primary)', overflowX: 'hidden' }}>
      {/* Header */}
      <header style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 10 }}>
        <div className="flex items-center gap-2">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,var(--primary),var(--primary-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🛡️</div>
          <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>GigSecure</span>
        </div>
        <button onClick={handleAdminLogin} className="btn btn-ghost btn-sm">
          Admin Login →
        </button>
      </header>

      {/* Hero */}
      <section className="hero-gradient" style={{ padding: '60px 24px 80px', textAlign: 'center', position: 'relative' }}>
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto' }}>
          <div className="badge badge-primary mb-4" style={{ display: 'inline-flex', fontSize: '0.8rem' }}>
            🚀 Built for Zepto, Blinkit & Instamart riders
          </div>
          <h1 className="mb-4" style={{ lineHeight: 1.1 }}>
            {t('hero_title')},{' '}
            <span className="text-gradient">Starting ₹49/week</span>
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: 40, lineHeight: 1.7 }}>
            {t('hero_sub')}
            <br />Automatic payouts — no forms, no waiting.
          </p>

          {/* Phone Input */}
          <div style={{ maxWidth: 400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="input-field" style={{ width: 64, flexShrink: 0, textAlign: 'center', padding: '14px 10px' }}>+91</div>
              <input
                className="input-field"
                style={{ flex: 1 }}
                placeholder="Enter mobile number"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                type="tel"
              />
            </div>
            <button
              className="btn btn-primary btn-lg w-full animate-pulse-glow"
              onClick={handleSendOtp}
              disabled={phone.length < 10}
            >
              Get Protected Now <ArrowRight size={18} />
            </button>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-6 mt-8" style={{ flexWrap: 'wrap' }}>
            {stats.map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-light)' }}>{s.value}</div>
                <div className="text-xs text-muted">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '60px 24px', maxWidth: 900, margin: '0 auto' }}>
        <h2 className="text-center mb-6" style={{ marginBottom: 40 }}>How GigSecure Protects You</h2>
        <div className="grid grid-3" style={{ gap: 20 }}>
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="card" style={{ textAlign: 'center', padding: 28 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16, background: `${color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', border: `1px solid ${color}30`
              }}>
                <Icon size={24} color={color} />
              </div>
              <h4 className="mb-2">{title}</h4>
              <p className="text-muted" style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '0 24px 80px', maxWidth: 700, margin: '0 auto' }}>
        <h2 className="text-center mb-6">3 Simple Steps</h2>
        {[
          { step: '01', title: 'Quick Onboarding', desc: 'Phone OTP + share your avg earnings. Takes under 2 minutes.' },
          { step: '02', title: 'Choose Your Cover', desc: 'Pick weekly plan starting ₹49. Add peak-hour booster if needed.' },
          { step: '03', title: 'Earn Worry-Free', desc: 'When rain or outage hits, we detect it and pay instantly.' },
        ].map(({ step, title, desc }) => (
          <div key={step} className="flex gap-4 mb-6">
            <div style={{
              width: 48, height: 48, borderRadius: 12, flexShrink: 0,
              background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '0.875rem', color: 'white'
            }}>{step}</div>
            <div>
              <h4 className="mb-1">{title}</h4>
              <p className="text-muted" style={{ fontSize: '0.875rem' }}>{desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '20px 24px', textAlign: 'center' }}>
        <p className="text-xs text-muted">© 2026 GigSecure · Demo Platform · No real financial transactions</p>
      </footer>

      {showOtp && <OtpModal phone={phone} onVerify={handleVerified} onClose={() => setShowOtp(false)} />}
    </div>
  );
}
