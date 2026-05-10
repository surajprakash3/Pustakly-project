import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
});

export default function UserDashboard() {
  const { token, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [orders, setOrders] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [library, setLibrary] = useState([]);
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
        const [dashboardRes, ordersRes, uploadsRes, libraryRes] = await Promise.all([
          api.get('/api/user/dashboard', { token }),
          api.get('/api/user/orders', { token }),
          api.get('/api/user/uploads', { token }),
          api.get('/api/user/library', { token })
        ]);

        if (!active) return;

        setDashboard(dashboardRes);
        setOrders(Array.isArray(ordersRes?.items) ? ordersRes.items : []);
        setUploads(Array.isArray(uploadsRes?.items) ? uploadsRes.items : []);
        setLibrary(Array.isArray(libraryRes?.items) ? libraryRes.items : []);
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
                    {upload.digitalFileUrl && (
                      <button 
                        onClick={() => navigate(`/user/reader/${upload.id}`)}
                        className="mt-2 text-[10px] font-bold text-[#b4512d] hover:underline flex items-center gap-1"
                      >
                        📖 Preview Reader
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      {/* Digital Library Section */}
      <section>
        <article className="user-portal-card rounded-2xl bg-white p-6 shadow-[0_12px_24px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-[#1d1b19]">📚 My Digital Library</h3>
            <span className="bg-[#fdf4ef] text-[#b4512d] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              {library.length} Books
            </span>
          </div>
          
          {library.length === 0 ? (
            <div className="text-center py-12 bg-[#fcfaf8] rounded-2xl border-2 border-dashed border-[#e8ddd4]">
              <p className="text-[#7a726b] mb-4">You haven't purchased any digital copies yet.</p>
              <a href="/books" className="text-[#b4512d] font-bold hover:underline">Browse Catalog →</a>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {library.map((book) => (
                <div key={book.id} className="flex flex-col gap-4 p-4 rounded-2xl border border-[#efe5dc] hover:border-[#b4512d] transition-all bg-white hover:shadow-lg group">
                  <div className="flex-1">
                    <h4 className="font-bold text-[#1d1b19] line-clamp-1">{book.title}</h4>
                    <p className="text-sm text-[#7a726b]">{book.creator}</p>
                    <p className="text-[10px] text-[#a88874] mt-2 uppercase font-bold tracking-tighter">Purchased on {new Date(book.purchaseDate).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => navigate(`/user/reader/${book.id}`)}
                      className="flex-1 bg-[#1d1b19] text-white py-2 rounded-xl text-xs font-bold hover:bg-[#3a2f2a] transition-colors"
                    >
                      Read Online
                    </button>
                    <a 
                      href={book.fileUrl} 
                      download 
                      className="px-3 bg-[#fdf4ef] text-[#b4512d] py-2 rounded-xl text-xs font-bold hover:bg-[#f9e9de] transition-colors flex items-center justify-center"
                    >
                      ↓
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
