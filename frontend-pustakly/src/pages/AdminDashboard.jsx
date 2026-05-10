import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid
} from 'recharts';
import AdminSidebar from '../components/AdminSidebar';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import './AdminDashboard.css';

/* ─── helpers ─── */
const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const pct = (v) => `${v >= 0 ? '+' : ''}${Number(v).toFixed(1)}%`;
const fmt = (v) => {
  const d = new Date(v);
  return isNaN(d) ? '' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const STATUS_COLOR = {
  Placed:              '#0ea5e9',
  Processing:          '#f59e0b',
  Shipped:             '#8b5cf6',
  'Out for Delivery':  '#f97316',
  Delivered:           '#22c55e',
  Cancelled:           '#ef4444',
};

const PIE_COLORS = ['#0ea5e9','#f59e0b','#8b5cf6','#f97316','#22c55e','#ef4444'];

/* ─── Sparkline mini-chart ─── */
function Spark({ data, color }) {
  return (
    <ResponsiveContainer width="100%" height={48}>
      <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#sg-${color.replace('#','')})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ─── KPI Card ─── */
function KpiCard({ label, value, trend, icon, color, spark }) {
  const up = !String(trend).startsWith('-');
  return (
    <div className="ad-kpi" style={{ '--kpi-color': color }}>
      <div className="ad-kpi-top">
        <div>
          <p className="ad-kpi-label">{label}</p>
          <h2 className="ad-kpi-value">{value}</h2>
        </div>
        <div className="ad-kpi-icon">{icon}</div>
      </div>
      <div className="ad-kpi-spark"><Spark data={spark} color={color} /></div>
      <div className="ad-kpi-footer">
        <span className={`ad-kpi-trend ${up ? 'up' : 'down'}`}>
          {up ? '▲' : '▼'} {trend}
        </span>
        <span className="ad-kpi-since">vs last month</span>
      </div>
    </div>
  );
}

/* ─── Command Palette ─── */
function CommandPalette({ open, onClose, orders, users, navigate }) {
  const [q, setQ] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) { setQ(''); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    const hits = [];
    orders.slice(0, 100).forEach(o => {
      if (
        o.orderId?.toLowerCase().includes(s) ||
        o.buyer?.name?.toLowerCase().includes(s) ||
        o.buyer?.email?.toLowerCase().includes(s)
      ) {
        hits.push({ type: 'order', label: `Order #${o.orderId}`, sub: o.buyer?.name, id: o.id });
      }
    });
    users.slice(0, 100).forEach(u => {
      if (u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s)) {
        hits.push({ type: 'user', label: u.name, sub: u.email, id: u.id });
      }
    });
    // Static nav
    [
      ['Go to Dashboard', '/admin/dashboard'],
      ['Manage Orders',   '/admin/orders'],
      ['Manage Users',    '/admin/users'],
      ['Books / Uploads', '/admin/books'],
      ['Reports',         '/admin/reports'],
    ].forEach(([label, path]) => {
      if (label.toLowerCase().includes(s)) hits.push({ type: 'nav', label, path });
    });
    return hits.slice(0, 8);
  }, [q, orders, users]);

  if (!open) return null;
  return (
    <div className="cp-backdrop" onClick={onClose}>
      <div className="cp-box" onClick={e => e.stopPropagation()}>
        <div className="cp-search-row">
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18" style={{ flexShrink: 0, color: '#9ca3af' }}>
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            className="cp-input"
            placeholder="Search orders, users, pages…"
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && onClose()}
          />
          <kbd className="cp-esc">ESC</kbd>
        </div>
        {results.length === 0 && q && (
          <div className="cp-empty">No results for "<strong>{q}</strong>"</div>
        )}
        {results.length === 0 && !q && (
          <div className="cp-hint-grid">
            {[['📦 Orders', '/admin/orders'], ['👥 Users', '/admin/users'], ['📚 Books', '/admin/books'], ['📊 Reports', '/admin/reports']].map(([label, path]) => (
              <button key={path} className="cp-quick" onClick={() => { navigate(path); onClose(); }}>{label}</button>
            ))}
          </div>
        )}
        <div className="cp-results">
          {results.map((r, i) => (
            <button key={i} className="cp-result" onClick={() => {
              if (r.type === 'nav') navigate(r.path);
              else if (r.type === 'order') navigate('/admin/orders');
              else navigate('/admin/users');
              onClose();
            }}>
              <span className="cp-result-type">{r.type === 'order' ? '📦' : r.type === 'user' ? '👤' : '→'}</span>
              <span className="cp-result-label">{r.label}</span>
              {r.sub && <span className="cp-result-sub">{r.sub}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ─── */
export default function AdminDashboard() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary]   = useState(null);
  const [sales, setSales]       = useState([]);
  const [orders, setOrders]     = useState([]);
  const [orderStats, setOrderStats] = useState([]);
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [cmdOpen, setCmdOpen]   = useState(false);

  /* Ctrl+K global shortcut */
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(v => !v); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const [sumRes, salesRes, ordRes, usrRes] = await Promise.all([
        api.get('/api/admin/analytics/summary', { token }),
        api.get('/api/admin/analytics/monthly-sales', { token }),
        api.get('/api/admin/orders', { token }),
        api.get('/api/admin/users', { token }),
      ]);
      setSummary(sumRes);
      setSales(Array.isArray(salesRes) ? salesRes.map(r => ({ ...r, v: r.revenue })) : []);
      const ord = Array.isArray(ordRes) ? ordRes : [];
      setOrders(ord);

      // Build status distribution for pie chart
      const counts = {};
      ord.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
      setOrderStats(Object.entries(counts).map(([name, value]) => ({ name, value })));

      setUsers(Array.isArray(usrRes) ? usrRes : []);
    } catch (err) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  /* Build sparkline data (last 6 sales entries) */
  const spark6 = useMemo(() => (sales.length >= 2 ? sales.slice(-6) : Array(6).fill({ v: 0 })), [sales]);
  const orderSpark = useMemo(() => spark6.map((_, i) => ({ v: Math.max(0, (orders.length / 6) * (i + 1)) })), [orders, spark6]);
  const userSpark  = useMemo(() => spark6.map((_, i) => ({ v: (summary?.totalUsers || 0) / 6 * (i + 1) })), [summary, spark6]);

  const recentOrders = useMemo(() => orders.slice(0, 7), [orders]);
  const recentUsers  = useMemo(() => users.slice(0, 5), [users]);

  /* Export CSV */
  const exportCSV = () => {
    const rows = [['Order ID','Buyer','Email','Total','Status','Date']];
    orders.forEach(o => rows.push([
      o.orderId, o.buyer?.name, o.buyer?.email,
      o.total, o.status, new Date(o.date).toLocaleDateString('en-IN')
    ]));
    const blob = new Blob([rows.map(r => r.map(c => `"${c ?? ''}"`).join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `pustakly_orders_${Date.now()}.csv`; a.click();
  };

  const initials = user?.name ? user.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() : 'AD';

  return (
    <div className="ad-shell">
      <AdminSidebar />

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} orders={orders} users={users} navigate={navigate} />

      <div className="ad-main">
        {/* Top bar */}
        <header className="ad-topbar">
          <div>
            <h1 className="ad-page-title">Dashboard</h1>
            <p className="ad-page-sub">Welcome back, {user?.name?.split(' ')[0] || 'Admin'} 👋</p>
          </div>
          <div className="ad-topbar-right">
            <button className="ad-cmd-btn" onClick={() => setCmdOpen(true)}>
              <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              Search…
              <kbd>Ctrl K</kbd>
            </button>
            <button className="ad-export-btn" onClick={exportCSV}>⬇ Export CSV</button>
            <button className="ad-refresh-btn" onClick={load} disabled={loading}>
              {loading ? '⟳' : '🔄'}
            </button>
            <Link to="/user/dashboard" className="ad-topbar-avatar" title="View site">{initials}</Link>
          </div>
        </header>

        <div className="ad-body">
          {error && <div className="ad-error">⚠️ {error}</div>}

          {/* KPI Cards */}
          <section className="ad-kpi-grid">
            {loading ? (
              [1,2,3,4].map(i => <div key={i} className="ad-kpi ad-skeleton" />)
            ) : (
              <>
                <KpiCard label="Total Revenue" value={INR.format(summary?.totalRevenue || 0)} trend={pct(summary?.revenueGrowth || 0)} icon="💰" color="#f97316" spark={spark6} />
                <KpiCard label="Total Orders"  value={(summary?.totalOrders ?? 0).toLocaleString()} trend={pct(summary?.ordersGrowth || 0)} icon="📦" color="#0ea5e9" spark={orderSpark} />
                <KpiCard label="Total Users"   value={(summary?.totalUsers ?? 0).toLocaleString()} trend={pct(summary?.usersGrowth || 0)} icon="👥" color="#8b5cf6" spark={userSpark} />
                <KpiCard label="Avg Order Value" value={INR.format(summary?.totalOrders ? (summary.totalRevenue / summary.totalOrders) : 0)} trend="+0.0%" icon="📈" color="#22c55e" spark={spark6.map(p => ({ v: p.v / 5 }))} />
              </>
            )}
          </section>

          {/* Charts row */}
          <section className="ad-charts-row">
            {/* Revenue Area Chart */}
            <div className="ad-chart-card wide">
              <div className="ad-chart-head">
                <div>
                  <h3>Revenue Trend</h3>
                  <p>Monthly revenue over time</p>
                </div>
                <span className="ad-badge orange">{pct(summary?.revenueGrowth || 0)}</span>
              </div>
              <div className="ad-chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sales}>
                    <defs>
                      <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: 12 }} />
                    <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} fill="url(#rev-grad)" dot={{ r: 4, fill: '#f97316' }} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Order Status Pie */}
            <div className="ad-chart-card">
              <div className="ad-chart-head">
                <div><h3>Order Status</h3><p>Distribution</p></div>
              </div>
              <div className="ad-chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={orderStats} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                      {orderStats.map((entry, index) => (
                        <Cell key={index} fill={STATUS_COLOR[entry.name] || PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="ad-pie-legend">
                {orderStats.map((s, i) => (
                  <div key={s.name} className="ad-pie-row">
                    <span className="ad-pie-dot" style={{ background: STATUS_COLOR[s.name] || PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="ad-pie-name">{s.name}</span>
                    <span className="ad-pie-val">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Bottom row: recent orders + recent users + monthly summary */}
          <section className="ad-bottom-row">
            {/* Recent Orders */}
            <div className="ad-table-card wide">
              <div className="ad-table-head">
                <h3>Recent Orders</h3>
                <Link to="/admin/orders" className="ad-view-all">View all →</Link>
              </div>
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Buyer</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.length === 0 && !loading && (
                      <tr><td colSpan={5} className="ad-empty-td">No orders yet</td></tr>
                    )}
                    {recentOrders.map(o => (
                      <tr key={o.id}>
                        <td><span className="ad-mono">#{o.orderId}</span></td>
                        <td>
                          <div className="ad-buyer-cell">
                            <div className="ad-mini-avatar">{(o.buyer?.name || 'U')[0]}</div>
                            <div>
                              <div className="ad-buyer-name">{o.buyer?.name || 'Unknown'}</div>
                              <div className="ad-buyer-email">{o.buyer?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td><strong>₹{Number(o.total || 0).toFixed(0)}</strong></td>
                        <td>
                          <span className="ad-status-pill" style={{ background: STATUS_COLOR[o.status] + '22', color: STATUS_COLOR[o.status] }}>
                            {o.status}
                          </span>
                        </td>
                        <td className="ad-muted">{fmt(o.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right column: Monthly Summary + Recent Users */}
            <div className="ad-right-col">
              {/* Monthly KPIs */}
              <div className="ad-table-card">
                <div className="ad-table-head"><h3>This Month</h3><span className="ad-badge green">On track</span></div>
                <ul className="ad-month-list">
                  {[
                    ['Net Revenue', INR.format(summary?.monthlySummary?.netRevenue || 0), 72],
                    ['Repeat Buyers', `${summary?.monthlySummary?.repeatCustomers || 0}%`, 58],
                    ['Fulfillment', `${summary?.monthlySummary?.fulfillmentDays || 0}d avg`, 85],
                  ].map(([label, val, pct]) => (
                    <li key={label} className="ad-month-item">
                      <div className="ad-month-row">
                        <span>{label}</span><strong>{val}</strong>
                      </div>
                      <div className="ad-bar-track">
                        <div className="ad-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recent Users */}
              <div className="ad-table-card">
                <div className="ad-table-head">
                  <h3>New Users</h3>
                  <Link to="/admin/users" className="ad-view-all">View all →</Link>
                </div>
                <div className="ad-user-list">
                  {recentUsers.map(u => (
                    <div key={u.id} className="ad-user-row">
                      <div className="ad-mini-avatar">{(u.name || u.email || 'U')[0].toUpperCase()}</div>
                      <div className="ad-user-meta">
                        <span className="ad-buyer-name">{u.name}</span>
                        <span className="ad-buyer-email">{u.email}</span>
                      </div>
                      <span className="ad-role-pill" style={{ background: u.role === 'admin' ? '#e0e7ff' : u.role === 'seller' ? '#fef3c7' : '#f1f5f9', color: u.role === 'admin' ? '#3730a3' : u.role === 'seller' ? '#b45309' : '#475569' }}>
                        {u.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="ad-quick-actions">
            <h3 className="ad-qa-title">Quick Actions</h3>
            <div className="ad-qa-grid">
              {[
                { icon: '📦', label: 'View Orders',    to: '/admin/orders'     },
                { icon: '👥', label: 'Manage Users',   to: '/admin/users'      },
                { icon: '📚', label: 'Approve Books',  to: '/admin/books'      },
                { icon: '🏷️', label: 'Categories',    to: '/admin/categories' },
                { icon: '📊', label: 'Reports',        to: '/admin/reports'    },
                { icon: '🔎', label: 'Search (Ctrl+K)', onClick: () => setCmdOpen(true) },
              ].map(action => (
                action.to ? (
                  <Link key={action.label} to={action.to} className="ad-qa-card">
                    <span className="ad-qa-icon">{action.icon}</span>
                    <span className="ad-qa-label">{action.label}</span>
                  </Link>
                ) : (
                  <button key={action.label} className="ad-qa-card" onClick={action.onClick}>
                    <span className="ad-qa-icon">{action.icon}</span>
                    <span className="ad-qa-label">{action.label}</span>
                  </button>
                )
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
