import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './UserPortal.css';

const tabs = [
  { label: 'Dashboard', to: '/user/dashboard' },
  { label: 'Marketplace', to: '/user/buy' },
  { label: 'Sell', to: '/user/sell' },
  { label: 'Seller Dashboard', to: '/user/seller' },
  { label: 'Profile', to: '/user/profile' }
];

export default function UserLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="user-portal min-h-screen bg-[#f7f3ee] text-[#1d1b19]">
      <header className="user-portal-header sticky top-0 z-30 border-b border-black/10 bg-[#f7f3ee]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#a88874]">User Portal</p>
            <h1 className="text-2xl font-semibold">Welcome, {user?.email?.split('@')[0] || 'Reader'}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/"
              className="rounded-full border border-[#d9cfc6] px-4 py-2 text-sm font-semibold"
            >
              Home
            </Link>
            <button
              type="button"
              className="rounded-full border border-[#d9cfc6] px-4 py-2 text-sm font-semibold"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
        <nav className="user-portal-tabs mx-auto flex max-w-6xl flex-wrap gap-2 px-6 pb-4">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-[#1d1b19] text-white'
                    : 'border border-[#e0ddd8] text-[#6f6861] hover:bg-[#efe7e1]'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="user-portal-main mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
