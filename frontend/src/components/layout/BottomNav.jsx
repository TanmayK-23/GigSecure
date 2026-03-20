import { NavLink } from 'react-router-dom';
import { Home, Shield, RefreshCw, TrendingUp } from 'lucide-react';

const tabs = [
  { to: '/rider', icon: Home, label: 'Home', end: true },
  { to: '/rider/policy', icon: Shield, label: 'Policy' },
  { to: '/rider/claims', icon: RefreshCw, label: 'Claims' },
  { to: '/rider/earnings', icon: TrendingUp, label: 'Earnings' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {tabs.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
        >
          <Icon size={20} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
