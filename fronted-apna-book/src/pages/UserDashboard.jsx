import { useEffect, useMemo, useState } from 'react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
});

export default function UserDashboard() {
  const { token, updateProfile } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [orders, setOrders] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    if (!token) {
      setLoading(false);
      setError('Please log in again to load dashboard data.');
      return () => {
        active = false;
      };
    }

    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const [dashboardRes, ordersRes, uploadsRes] = await Promise.all([
          api.get('/api/user/dashboard', { token }),
          api.get('/api/user/orders', { token }),
          api.get('/api/user/uploads', { token })
        ]);

        if (!active) return;

        setDashboard(dashboardRes);
        setOrders(Array.isArray(ordersRes?.items) ? ordersRes.items : []);
        setUploads(Array.isArray(uploadsRes?.items) ? uploadsRes.items : []);
        if (dashboardRes?.user) {
          updateProfile(dashboardRes.user);
        }
      } catch (requestError) {
        if (!active) return;
        setError(requestError.message || 'Failed to load dashboard data');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, [token, updateProfile]);

  const stats = useMemo(
    () => [
      { label: 'Total Orders', value: dashboard?.stats?.totalOrders ?? 0 },
      { label: 'Active Uploads', value: dashboard?.stats?.activeUploads ?? 0 },
      {
        label: 'Earnings',
        value: currency.format(Number(dashboard?.stats?.totalEarnings || 0))
      }
    ],
    [dashboard]
  );

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#e8ddd4] bg-white p-6 text-sm text-[#7a726b]">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-[#f3c7bf] bg-[#fff3f0] p-6 text-sm font-semibold text-[#a53f30]">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="user-portal-card rounded-2xl bg-white p-5 shadow-[0_12px_24px_rgba(0,0,0,0.08)]"
          >
            <p className="text-sm text-[#7a726b]">{stat.label}</p>
            <h2 className="text-2xl font-semibold">{stat.value}</h2>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="user-portal-card rounded-2xl bg-white p-6 shadow-[0_12px_24px_rgba(0,0,0,0.08)]">
          <h3 className="text-lg font-semibold">My Orders</h3>
          <div className="mt-4 space-y-3">
            {orders.length === 0 ? (
              <p className="text-sm text-[#7a726b]">No orders found.</p>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="user-portal-row flex items-center justify-between rounded-xl border border-[#efe5dc] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold">{order.title}</p>
                    <p className="text-xs text-[#7a726b]">{order.orderNumber}</p>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-[#f5eee7] px-3 py-1 text-xs font-semibold text-[#a05c3b]">
                      {order.status}
                    </span>
                    <p className="mt-1 text-sm font-semibold">{currency.format(Number(order.price || 0))}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="user-portal-card rounded-2xl bg-white p-6 shadow-[0_12px_24px_rgba(0,0,0,0.08)]">
          <h3 className="text-lg font-semibold">My Uploads</h3>
          <div className="mt-4 space-y-3">
            {uploads.length === 0 ? (
              <p className="text-sm text-[#7a726b]">No uploads found.</p>
            ) : (
              uploads.map((upload) => (
                <div
                  key={upload.id}
                  className="user-portal-row flex items-center justify-between rounded-xl border border-[#efe5dc] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold">{upload.title}</p>
                    <p className="text-xs text-[#7a726b]">{upload.uploadNumber}</p>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-[#e0e7ff] px-3 py-1 text-xs font-semibold text-[#4338ca]">
                      {upload.status}
                    </span>
                    <p className="mt-1 text-sm font-semibold">{currency.format(Number(upload.price || 0))}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
