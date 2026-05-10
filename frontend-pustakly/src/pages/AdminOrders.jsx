import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import './AdminOrders.css';

const STATUS_CONFIG = {
  Placed:             { bg: '#e0f2fe', color: '#0369a1' },
  Processing:         { bg: '#fef9c3', color: '#854d0e' },
  Shipped:            { bg: '#ede9fe', color: '#6d28d9' },
  'Out for Delivery': { bg: '#fff7ed', color: '#c2410c' },
  Delivered:          { bg: '#dcfce7', color: '#15803d' },
  Cancelled:          { bg: '#fee2e2', color: '#b91c1c' },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG);

const PAY_ICONS = { card: '💳', upi: '📱', cod: '💵' };

const fmt = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d) ? '—' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] || { bg: '#f1f5f9', color: '#475569' };
  return (
    <span className="ao-pill" style={{ background: cfg.bg, color: cfg.color }}>
      {status}
    </span>
  );
}

export default function AdminOrders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  
  // Agent Modal State
  const [agentModal, setAgentModal] = useState({
    open: false, orderId: null,
    data: { name: '', phone: '', vehicle: '', liveDistance: '3.2 km away', estimatedArrival: '~15 mins' }
  });

  // Payment Settings Modal State
  const [payModal, setPayModal] = useState({
    open: false, loading: false,
    data: { upiId: '', upiName: '', bankName: '', accountNumber: '', ifscCode: '', accountName: '', instructions: '' }
  });

  const showToast = (msg, isError = false) => {
    setToast(isError ? `❌ ${msg}` : `✅ ${msg}`);
    setTimeout(() => setToast(''), 3500);
  };

  const loadOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const qs = statusFilter !== 'All' ? `?status=${encodeURIComponent(statusFilter)}` : '';
      const data = await api.get(`/api/admin/orders${qs}`, { token });
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // Update order status
  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    // Optimistic update
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    try {
      const updated = await api.patch(`/api/admin/orders/${id}/status`, { status }, { token });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updated } : o));
      showToast(`Order status updated to ${status}`);
    } catch (err) {
      showToast(err.message || 'Failed to update status', true);
      loadOrders(); // revert
    } finally {
      setUpdatingId(null);
    }
  };

  // Open Delivery Agent Modal
  const openAgentModal = (order) => {
    setAgentModal({
      open: true,
      orderId: order.id,
      data: order.deliveryAgent || { name: '', phone: '', vehicle: '', liveDistance: '3.2 km away', estimatedArrival: '~15 mins' }
    });
  };

  const closeAgentModal = () => {
    setAgentModal({ open: false, orderId: null, data: { name: '', phone: '', vehicle: '', liveDistance: '', estimatedArrival: '' } });
  };

  const handleAgentChange = (e) => {
    setAgentModal(prev => ({
      ...prev,
      data: { ...prev.data, [e.target.name]: e.target.value }
    }));
  };

  const submitAgent = async (e) => {
    e.preventDefault();
    const { orderId, data } = agentModal;
    if (!data.name) return showToast('Agent name is required', true);
    
    try {
      const updated = await api.patch(`/api/admin/orders/${orderId}/agent`, data, { token });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updated } : o));
      showToast(`Delivery agent ${data.name} assigned.`);
      closeAgentModal();
    } catch (err) {
      showToast(err.message || 'Failed to assign agent', true);
    }
  };

  // Delete order
  const deleteOrder = async (id, orderId) => {
    if (!window.confirm(`Delete order #${orderId}? This cannot be undone.`)) return;
    setDeletingId(id);
    setOrders(prev => prev.filter(o => o.id !== id));
    try {
      await api.delete(`/api/admin/orders/${id}`, { token });
      showToast(`Order #${orderId} deleted`);
    } catch (err) {
      showToast(err.message || 'Failed to delete order', true);
      loadOrders();
    } finally {
      setDeletingId(null);
    }
  };

  // Payment Settings Logic
  const openPayModal = async () => {
    setPayModal(p => ({ ...p, open: true, loading: true }));
    try {
      const settings = await api.get('/api/admin/orders/settings/payment', { token });
      setPayModal({ open: true, loading: false, data: settings || {} });
    } catch (err) {
      showToast('Failed to fetch payment settings', true);
      setPayModal(p => ({ ...p, open: false, loading: false }));
    }
  };

  const submitPayModal = async (e) => {
    e.preventDefault();
    try {
      await api.patch('/api/admin/orders/settings/payment', payModal.data, { token });
      showToast('Payment settings updated successfully');
      setPayModal(p => ({ ...p, open: false }));
    } catch (err) {
      showToast(err.message || 'Failed to update settings', true);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter(o => {
      if (!q) return true;
      return (
        o.orderId?.toLowerCase().includes(q) ||
        o.buyer?.name?.toLowerCase().includes(q) ||
        o.buyer?.email?.toLowerCase().includes(q)
      );
    });
  }, [orders, search]);

  return (
    <div className="admin-shell ao-page">
      <AdminSidebar />

      {/* Toast */}
      {toast && (
        <div className={`ao-toast ${toast.startsWith('❌') ? 'error' : ''}`}>{toast}</div>
      )}

      <div className="ao-content">
        {/* Header */}
        <header className="ao-header">
          <div className="ao-header-left">
            <h1 className="ao-title">Order Management</h1>
            <p className="ao-subtitle">Process, track, and manage all incoming orders.</p>
          </div>
          <div className="ao-header-actions">
            <button className="ao-action-btn primary" onClick={openPayModal} style={{ background: '#b4512d', borderColor: '#b4512d', color: 'white' }}>
              ⚙️ Payment Settings
            </button>
            <button className="ao-btn-outline" onClick={loadOrders} disabled={loading}>
              {loading ? '⟳ Refreshing…' : '🔄 Refresh'}
            </button>
          </div>
        </header>

        {/* Filters */}
        <div className="ao-filters">
          <div className="ao-search-wrap">
            <span>🔎</span>
            <input
              className="ao-search"
              placeholder="Search by order ID, buyer name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="ao-status-tabs">
            {['All', ...ALL_STATUSES].map(s => (
              <button
                key={s}
                className={`ao-tab${statusFilter === s ? ' active' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s}
                {s !== 'All' && (
                  <span className="ao-tab-count">
                    {orders.filter(o => o.status === s).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && <div className="ao-error-box">⚠️ {error}</div>}

        {/* Loading */}
        {loading && (
          <div className="ao-skeleton">
            {[1, 2, 3].map(i => <div key={i} className="ao-skeleton-row" />)}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="ao-empty">
            <span>📦</span>
            <p>No orders found{statusFilter !== 'All' ? ` for status "${statusFilter}"` : ''}</p>
          </div>
        )}

        {/* Orders List */}
        {!loading && (
          <div className="ao-list">
            {filtered.map(order => {
              const isExpanded = expandedId === order.id;
              const isUpdating = updatingId === order.id;
              const si = order.shippingInfo || {};

              return (
                <div key={order.id} className={`ao-card${isExpanded ? ' expanded' : ''}`}>
                  {/* Card Header */}
                  <div className="ao-card-top" onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                    <div className="ao-card-left">
                      <div className="ao-order-id">#{order.orderId}</div>
                      <div className="ao-buyer">
                        <span className="ao-buyer-name">{order.buyer?.name || 'Unknown'}</span>
                        <span className="ao-buyer-email">{order.buyer?.email}</span>
                      </div>
                    </div>
                    <div className="ao-card-right">
                      <div className="ao-meta-row">
                        <span className="ao-date">📅 {fmt(order.date)}</span>
                        <span className="ao-pay">{PAY_ICONS[order.paymentMethod]} {order.paymentMethod?.toUpperCase()}</span>
                      </div>
                      <div className="ao-amount">₹{Number(order.total).toFixed(2)}</div>
                      <StatusPill status={order.status} />
                      <svg className={`ao-chevron${isExpanded ? ' open' : ''}`} viewBox="0 0 24 24" fill="none" width="18" height="18">
                        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>

                  {/* Expanded Body */}
                  {isExpanded && (
                    <div className="ao-card-body">
                      <div className="ao-body-grid">
                        {/* Items */}
                        <div className="ao-section">
                          <div className="ao-section-title">📚 Items</div>
                          <div className="ao-items">
                            {(order.items || []).map((item, i) => (
                              <div key={i} className="ao-item">
                                <div className="ao-item-dot">{(item.title || 'B')[0]}</div>
                                <span className="ao-item-name">{item.title}</span>
                                <span className="ao-item-qty">×{item.quantity}</span>
                              </div>
                            ))}
                          </div>
                          <div className="ao-financials">
                            <div className="ao-fin-row"><span>Subtotal</span><span>₹{Number(order.subtotal).toFixed(2)}</span></div>
                            <div className="ao-fin-row"><span>Tax</span><span>₹{Number(order.tax).toFixed(2)}</span></div>
                            <div className="ao-fin-row bold"><span>Total</span><span>₹{Number(order.total).toFixed(2)}</span></div>
                          </div>
                        </div>

                        {/* Shipping */}
                        <div className="ao-section">
                          <div className="ao-section-title">📍 Shipping Address</div>
                          {si.address ? (
                            <div className="ao-address">
                              <strong>{si.firstName} {si.lastName}</strong><br />
                              {si.address}<br />
                              {si.city}, {si.state} — {si.postal}<br />
                              📞 {si.phone}
                            </div>
                          ) : <p className="ao-na">No address on file</p>}
                        </div>

                        {/* Delivery Agent Control */}
                        <div className="ao-section">
                          <div className="ao-section-title">🚚 Delivery Agent</div>
                          {order.deliveryAgent && order.deliveryAgent.name ? (
                            <div className="ao-address" style={{ backgroundColor: '#f0fdfa', padding: '1rem', borderRadius: '12px', border: '1px solid #ccfbf1' }}>
                              <strong style={{ color: '#115e59' }}>{order.deliveryAgent.name}</strong><br />
                              📞 {order.deliveryAgent.phone}<br />
                              🚗 {order.deliveryAgent.vehicle}<br />
                              <span style={{ color: '#0f766e', fontSize: '0.8rem', fontWeight: 600 }}>{order.deliveryAgent.liveDistance} · {order.deliveryAgent.estimatedArrival}</span>
                            </div>
                          ) : <p className="ao-na">No agent assigned</p>}
                          <button className="ao-action-btn primary" style={{ marginTop: '0.8rem', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} onClick={() => openAgentModal(order)}>
                            {order.deliveryAgent?.name ? 'Update Agent' : 'Assign Agent'}
                          </button>
                        </div>

                        {/* Status Control */}
                        <div className="ao-section ao-status-section">
                          <div className="ao-section-title">🔧 Update Status</div>
                          <div className="ao-status-btns">
                            {ALL_STATUSES.map(s => (
                              <button
                                key={s}
                                className={`ao-status-btn${order.status === s ? ' current' : ''}`}
                                style={order.status === s ? {
                                  background: STATUS_CONFIG[s]?.bg,
                                  color: STATUS_CONFIG[s]?.color,
                                  borderColor: STATUS_CONFIG[s]?.color
                                } : {}}
                                disabled={isUpdating || order.status === s}
                                onClick={() => updateStatus(order.id, s)}
                              >
                                {isUpdating && order.status !== s ? '…' : s}
                              </button>
                            ))}
                          </div>
                          <div className="ao-danger-zone">
                            <button
                              className="ao-delete-btn"
                              onClick={() => deleteOrder(order.id, order.orderId)}
                              disabled={deletingId === order.id}
                            >
                              {deletingId === order.id ? 'Deleting…' : '🗑️ Delete Order'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delivery Agent Modal */}
      {agentModal.open && (
        <div className="ao-modal-overlay">
          <div className="ao-modal">
            <h2>Assign Delivery Agent</h2>
            <form onSubmit={submitAgent}>
              <div className="ao-form-group">
                <label>Agent Name</label>
                <input type="text" name="name" required value={agentModal.data.name} onChange={handleAgentChange} placeholder="e.g. Ravi Kumar" />
              </div>
              <div className="ao-form-group">
                <label>Phone Number</label>
                <input type="text" name="phone" required value={agentModal.data.phone} onChange={handleAgentChange} placeholder="e.g. +91 9876543210" />
              </div>
              <div className="ao-form-group">
                <label>Vehicle Details</label>
                <input type="text" name="vehicle" required value={agentModal.data.vehicle} onChange={handleAgentChange} placeholder="e.g. MH 12 AB 3456" />
              </div>
              <div className="ao-form-group">
                <label>Live Distance</label>
                <input type="text" name="liveDistance" required value={agentModal.data.liveDistance} onChange={handleAgentChange} placeholder="e.g. 3.2 km away" />
              </div>
              <div className="ao-form-group">
                <label>Estimated Arrival</label>
                <input type="text" name="estimatedArrival" required value={agentModal.data.estimatedArrival} onChange={handleAgentChange} placeholder="e.g. ~15 mins" />
              </div>
              <div className="ao-modal-actions">
                <button type="button" className="ao-btn-cancel" onClick={closeAgentModal}>Cancel</button>
                <button type="submit" className="ao-btn-save">Save Details</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Settings Modal */}
      {payModal.open && (
        <div className="ao-modal-overlay">
          <div className="ao-modal" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2>Global Payment Settings</h2>
            {payModal.loading ? <p>Loading...</p> : (
              <form onSubmit={submitPayModal}>
                <h3 style={{ margin: '1rem 0 0.5rem', color: '#115e59' }}>UPI Details</h3>
                <div className="ao-form-group">
                  <label>UPI ID (VPA)</label>
                  <input type="text" value={payModal.data.upiId || ''} onChange={e => setPayModal(p => ({...p, data: {...p.data, upiId: e.target.value}}))} placeholder="admin@okicici" />
                </div>
                <div className="ao-form-group">
                  <label>UPI Business Name</label>
                  <input type="text" value={payModal.data.upiName || ''} onChange={e => setPayModal(p => ({...p, data: {...p.data, upiName: e.target.value}}))} placeholder="Pustakly Store" />
                </div>

                <h3 style={{ margin: '1.5rem 0 0.5rem', color: '#0f172a' }}>Direct Bank Transfer Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="ao-form-group">
                    <label>Bank Name</label>
                    <input type="text" value={payModal.data.bankName || ''} onChange={e => setPayModal(p => ({...p, data: {...p.data, bankName: e.target.value}}))} placeholder="e.g. HDFC Bank" />
                  </div>
                  <div className="ao-form-group">
                    <label>Account Number</label>
                    <input type="text" value={payModal.data.accountNumber || ''} onChange={e => setPayModal(p => ({...p, data: {...p.data, accountNumber: e.target.value}}))} placeholder="Account No" />
                  </div>
                  <div className="ao-form-group">
                    <label>IFSC Code</label>
                    <input type="text" value={payModal.data.ifscCode || ''} onChange={e => setPayModal(p => ({...p, data: {...p.data, ifscCode: e.target.value}}))} placeholder="IFSC Code" />
                  </div>
                  <div className="ao-form-group">
                    <label>Account Name</label>
                    <input type="text" value={payModal.data.accountName || ''} onChange={e => setPayModal(p => ({...p, data: {...p.data, accountName: e.target.value}}))} placeholder="Business Name" />
                  </div>
                </div>

                <div className="ao-form-group" style={{ marginTop: '0.5rem' }}>
                  <label>Payment Instructions</label>
                  <input type="text" value={payModal.data.instructions || ''} onChange={e => setPayModal(p => ({...p, data: {...p.data, instructions: e.target.value}}))} placeholder="Instructions for user" />
                </div>

                <div className="ao-modal-actions">
                  <button type="button" className="ao-btn-cancel" onClick={() => setPayModal(p => ({...p, open: false}))}>Cancel</button>
                  <button type="submit" className="ao-btn-save" style={{ background: '#b4512d', borderColor: '#b4512d' }}>Save Settings</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
