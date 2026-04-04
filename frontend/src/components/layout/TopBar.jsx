import { Bell, X, CheckCircle, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePolicy } from '../../contexts/PolicyContext';

export default function TopBar({ title }) {
  const { notifications, unreadCount, dispatch } = usePolicy();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  });

  // #12: Toggle dark/light mode
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('gs-theme', next);
  };

  // Restore saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('gs-theme');
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    }
  }, []);

  const markRead = () => {
    dispatch({ type: 'MARK_READ' });
  };

  return (
    <header style={{
      padding: '16px 24px',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'var(--bg-primary)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{title}</h3>

      <div className="flex items-center gap-2">
        {/* #12: Theme Toggle */}
        <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setOpen(o => !o); if (!open) markRead(); }}
            style={{
              width: 40, height: 40, borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)', cursor: 'pointer', position: 'relative',
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount}</span>
            )}
          </button>

          {open && (
            <div style={{
              position: 'absolute',
              top: 48,
              right: 0,
              width: 320,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-md)',
              zIndex: 100,
              overflow: 'hidden',
            }}>
              <div className="flex items-center justify-between" style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Notifications</span>
                <button onClick={() => setOpen(false)} style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {notifications.map(n => (
                  <div key={n.id} style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start',
                    background: n.read ? 'transparent' : 'rgba(108,71,255,.05)',
                  }}>
                    <div style={{ color: 'var(--success)', marginTop: 2 }}>
                      <CheckCircle size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{n.text}</div>
                      <div className="text-xs text-muted mt-1">{n.time || 'Just now'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
