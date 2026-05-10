import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './AdminSidebar.css';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext.jsx';

/* ─── SVG icon set ─── */
const Icon = ({ name, size = 18 }) => {
  const icons = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/></>,
    books: <><path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="1.8"/></>,
    orders: <><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.8"/><path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></>,
    users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></>,
    categories: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/></>,
    reports: <><line x1="18" y1="20" x2="18" y2="10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="12" y1="20" x2="12" y2="4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="6" y1="20" x2="6" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></>,
    logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></>,
    chevronLeft: <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>,
    chevronRight: <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>,
    menu: <><line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></>,
    close: <><line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></>,
    cmd: <><path d="M18 3a3 3 0 00-3 3v12a3 3 0 003 3 3 3 0 003-3 3 3 0 00-3-3H6a3 3 0 00-3 3 3 3 0 003 3 3 3 0 003-3V6a3 3 0 00-3-3 3 3 0 00-3 3 3 3 0 003 3h12a3 3 0 003-3 3 3 0 00-3-3z" stroke="currentColor" strokeWidth="1.8"/></>,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size} style={{ flexShrink: 0 }}>
      {icons[name]}
    </svg>
  );
};

const NAV_ITEMS = [
  { label: 'Dashboard',  icon: 'dashboard',   to: '/admin/dashboard' },
  { label: 'Books',      icon: 'books',       to: '/admin/books' },
  { label: 'Orders',     icon: 'orders',      to: '/admin/orders' },
  { label: 'Users',      icon: 'users',       to: '/admin/users' },
  { label: 'Categories', icon: 'categories',  to: '/admin/categories' },
  { label: 'Reports',    icon: 'reports',     to: '/admin/reports' },
];

const SIDEBAR_W  = 260;
const COLLAPSED_W = 72;

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="asb-clock">
      <span className="asb-clock-time">
        {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
      </span>
      <span className="asb-clock-date">
        {time.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
      </span>
    </div>
  );
}

export default function AdminSidebar() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { logout, user } = useAuth();
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [collapsed,   setCollapsed]   = useState(false);

  const initials = useMemo(() =>
    user?.name ? user.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() : 'AD',
    [user]
  );

  const sidebarWidth = collapsed ? COLLAPSED_W : SIDEBAR_W;

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  return (
    <>
      {/* ── Mobile top bar (hidden on desktop) ── */}
      <div className="asb-mobile-bar">
        <button type="button" onClick={() => setMobileOpen(true)} className="asb-mobile-btn">
          <Icon name="menu" size={20} />
        </button>
        <span className="asb-mobile-title">Admin Console</span>
        <div className="asb-avatar">{initials}</div>
      </div>

      {/* ── Backdrop (mobile only) ── */}
      {mobileOpen && (
        <div className="asb-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Fixed sidebar panel ── */}
      <aside
        className={`asb-panel${mobileOpen ? ' mobile-open' : ''}${collapsed ? ' collapsed' : ''}`}
        style={{ width: sidebarWidth }}
      >
        {/* Header */}
        <div className="asb-header">
          <div className="asb-brand">
            <img className="asb-logo" src={logo} alt="Pustakly" />
            {!collapsed && (
              <div className="asb-brand-text">
                <span className="asb-brand-name">Pustakly</span>
                <span className="asb-brand-role">Admin Console</span>
              </div>
            )}
          </div>
          <div className="asb-header-actions">
            {/* Desktop collapse toggle */}
            <button type="button" className="asb-icon-btn asb-desktop-only" onClick={() => setCollapsed(v => !v)} title="Toggle sidebar">
              <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size={15} />
            </button>
            {/* Mobile close */}
            <button type="button" className="asb-icon-btn asb-mobile-only" onClick={() => setMobileOpen(false)}>
              <Icon name="close" size={15} />
            </button>
          </div>
        </div>

        {/* Live clock */}
        {!collapsed && <LiveClock />}

        {/* Search hint */}
        {!collapsed && (
          <div className="asb-cmd-hint">
            <Icon name="cmd" size={12} />
            <span>Press <kbd>Ctrl K</kbd> to search</span>
          </div>
        )}

        {/* Nav */}
        <nav className="asb-nav">
          {NAV_ITEMS.map(item => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`asb-link${isActive ? ' active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <span className="asb-link-icon">
                  <Icon name={item.icon} size={17} />
                </span>
                {!collapsed && <span className="asb-link-label">{item.label}</span>}
                {!collapsed && isActive && <span className="asb-active-dot" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="asb-bottom">
          {!collapsed && (
            <div className="asb-user-card">
              <div className="asb-avatar">{initials}</div>
              <div className="asb-user-info">
                <span className="asb-user-name">{user?.name || 'Admin'}</span>
                <span className="asb-user-role">Super Admin</span>
              </div>
              <span className="asb-online-dot" />
            </div>
          )}
          <button type="button" className="asb-logout" onClick={handleLogout} title="Logout">
            <Icon name="logout" size={16} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Desktop spacer — same width as sidebar, keeps content from going under it ── */}
      <div className="asb-spacer asb-desktop-only" style={{ width: sidebarWidth, flexShrink: 0 }} />
    </>
  );
}
