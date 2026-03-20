import { NavLink, useNavigate } from 'react-router-dom';
import { Home, FileText, RefreshCw, User, LayoutDashboard, Shield, LogOut, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';

const riderNav = [
  { to: '/rider', icon: Home, label: 'Home', end: true },
  { to: '/rider/policy', icon: Shield, label: 'Policy' },
  { to: '/rider/claims', icon: RefreshCw, label: 'Claims' },
  { to: '/rider/earnings', icon: TrendingUp, label: 'Earnings' },
];

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
];

export default function Sidebar() {
  const { isAdmin, user, logout } = useAuth();
  const { lang, toggleLang } = useI18n();
  const navigate = useNavigate();
  const nav = isAdmin ? adminNav : riderNav;

  return (
    <aside className="app-sidebar">
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 mb-1">
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16
          }}>🛡️</div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>GigSecure</span>
        </div>
        <span className="text-xs text-muted">Income Protection</span>
      </div>

      {/* Nav Links */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {nav.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              color: isActive ? 'var(--primary-light)' : 'var(--text-secondary)',
              background: isActive ? 'rgba(108,71,255,.12)' : 'transparent',
              fontWeight: isActive ? 600 : 500,
              fontSize: '0.9rem',
              transition: 'var(--transition)',
              textDecoration: 'none',
              border: isActive ? '1px solid rgba(108,71,255,.2)' : '1px solid transparent',
            })}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User & Controls */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
        {/* Lang toggle */}
        <button
          onClick={toggleLang}
          className="btn btn-ghost btn-sm w-full mb-2"
          style={{ justifyContent: 'center', fontSize: '0.8rem' }}
        >
          🌐 {lang === 'en' ? 'हिंदी' : 'English'}
        </button>

        {/* User */}
        <div className="flex items-center gap-2 mb-2" style={{ padding: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 13, flexShrink: 0
          }}>
            {user?.name?.[0] || 'U'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'Rider'}
            </div>
            <div className="text-xs text-muted">{isAdmin ? 'Admin' : 'Rider'}</div>
          </div>
        </div>

        <button onClick={logout} className="btn btn-ghost btn-sm w-full" style={{ color: 'var(--danger-light)', fontSize: '0.8rem' }}>
          <LogOut size={14} /> Logout
        </button>
      </div>
    </aside>
  );
}
