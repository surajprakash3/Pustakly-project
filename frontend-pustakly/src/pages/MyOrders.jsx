import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import './MyOrders.css';

const STATUS_COLOR = {
  Placed:            { bg: '#e0f2fe', color: '#0369a1', dot: '#0ea5e9' },
  Processing:        { bg: '#fef9c3', color: '#854d0e', dot: '#f59e0b' },
  Shipped:           { bg: '#ede9fe', color: '#6d28d9', dot: '#8b5cf6' },
  'Out for Delivery':{ bg: '#fff7ed', color: '#c2410c', dot: '#f97316' },
  Delivered:         { bg: '#dcfce7', color: '#15803d', dot: '#22c55e' },
  Cancelled:         { bg: '#fee2e2', color: '#b91c1c', dot: '#ef4444' },
};

function StatusBadge({ status }) {
  const s = STATUS_COLOR[status] || { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' };
  return (
    <span style={{ background: s.bg, color: s.color }}
      className="status-badge">
      <span style={{ background: s.dot }} className="status-dot" />
      {status}
    </span>
  );
}

function fmt(date) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export default function MyOrders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        setLoading(true);
        const data = await api.get('/api/orders/my-orders', { token });
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) return (
    <div className="mo-center">
      <div className="mo-spinner" />
      <p className="mo-loading-text">Loading your orders…</p>
    </div>
  );

  if (error) return (
    <div className="mo-center">
      <div className="mo-error-box">⚠️ {error}</div>
    </div>
  );

  return (
    <div className="mo-page">
      {/* Header */}
      <div className="mo-header">
        <div>
          <h1 className="mo-title">My Orders</h1>
          <p className="mo-sub">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
        </div>
        <Link to="/marketplace" className="mo-shop-btn">
          <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2"/>
            <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Shop More
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="mo-empty">
          <div className="mo-empty-icon">📦</div>
          <h3>No orders yet</h3>
          <p>Looks like you haven't placed any orders. Start exploring!</p>
          <Link to="/marketplace" className="mo-cta">Browse Marketplace</Link>
        </div>
      ) : (
        <div className="mo-list">
          {orders.map((order) => {
            const si = order.shippingInfo || {};
            const estDelivery = addDays(order.createdAt, 5);
            const isExpanded = expanded === order._id;
            const shortId = String(order._id).slice(-8).toUpperCase();

            return (
              <div key={order._id} className={`mo-card${isExpanded ? ' expanded' : ''}`}>
                {/* Card Header */}
                <div className="mo-card-header" onClick={() => setExpanded(isExpanded ? null : order._id)}>
                  <div className="mo-card-left">
                    <div className="mo-order-id">
                      <span className="mo-id-label">Order</span>
                      <span className="mo-id-val">#{shortId}</span>
                    </div>
                    <div className="mo-meta">
                      <span>📅 {fmt(order.createdAt)}</span>
                      <span>·</span>
                      <span>{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</span>
                      <span>·</span>
                      <span className="mo-payment-tag">
                        {order.paymentMethod === 'card' ? '💳 Card'
                          : order.paymentMethod === 'upi' ? '📱 UPI'
                          : '💵 COD'}
                      </span>
                    </div>
                  </div>

                  <div className="mo-card-right">
                    <div className="mo-total">₹{Number(order.total).toFixed(2)}</div>
                    <StatusBadge status={order.status} />
                    <svg
                      className={`mo-chevron${isExpanded ? ' open' : ''}`}
                      viewBox="0 0 24 24" fill="none" width="18" height="18"
                    >
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>

                {/* Expandable Detail */}
                {isExpanded && (
                  <div className="mo-card-body">

                    {/* Items */}
                    <div className="mo-section">
                      <div className="mo-section-title">📚 Items Ordered</div>
                      <div className="mo-items">
                        {(order.items || []).map((item, idx) => (
                          <div key={idx} className="mo-item">
                            <div className="mo-item-avatar">{(item.title || 'B')[0].toUpperCase()}</div>
                            <div className="mo-item-info">
                              <div className="mo-item-title">{item.title}</div>
                              <div className="mo-item-qty">Qty: {item.quantity}</div>
                            </div>
                            <div className="mo-item-price">₹{(item.price * item.quantity).toFixed(2)}</div>
                          </div>
                        ))}
                      </div>
                      <div className="mo-totals">
                        <div className="mo-total-row"><span>Subtotal</span><span>₹{Number(order.subtotal).toFixed(2)}</span></div>
                        <div className="mo-total-row"><span>Tax</span><span>₹{Number(order.tax).toFixed(2)}</span></div>
                        <div className="mo-total-row mo-total-bold"><span>Total</span><span>₹{Number(order.total).toFixed(2)}</span></div>
                      </div>
                    </div>

                    <div className="mo-divider" />

                    {/* Shipping & Delivery */}
                    <div className="mo-two-col">
                      <div className="mo-section">
                        <div className="mo-section-title">📍 Shipping Address</div>
                        {si.firstName ? (
                          <div className="mo-address">
                            <strong>{si.firstName} {si.lastName}</strong><br />
                            {si.address}<br />
                            {si.city}, {si.state} — {si.postal}<br />
                            📞 {si.phone}
                          </div>
                        ) : (
                          <p className="mo-na">No address on file</p>
                        )}
                      </div>

                      <div className="mo-section">
                        <div className="mo-section-title">🚚 Delivery Info</div>
                        <div className="mo-delivery-info">
                          <div className="mo-dl-row">
                            <span>Status</span>
                            <StatusBadge status={order.status} />
                          </div>
                          <div className="mo-dl-row">
                            <span>Est. Delivery</span>
                            <strong>{order.status === 'Delivered' ? '✅ Delivered' : fmt(estDelivery)}</strong>
                          </div>
                          <div className="mo-dl-row">
                            <span>Order Date</span>
                            <strong>{fmt(order.createdAt)}</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mo-divider" />

                    {/* Actions */}
                    <div className="mo-actions">
                      <Link
                        to={`/order-success/${order._id}`}
                        className="mo-action-btn primary"
                      >
                        <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2C20 17.5 12 22 12 22z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/></svg>
                        View & Track Order
                      </Link>
                      {['Placed', 'Processing'].includes(order.status) && (
                        <button className="mo-action-btn danger" onClick={() => {}}>
                          ❌ Cancel Order
                        </button>
                      )}
                      {order.status === 'Delivered' && (
                        <button className="mo-action-btn secondary" onClick={() => {}}>
                          🔄 Exchange / Return
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
