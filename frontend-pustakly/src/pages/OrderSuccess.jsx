import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import './OrderSuccess.css';

/* ── helpers ── */
const STATUS_STEPS = ['Placed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function fmt(date) {
  return new Date(date).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });
}

function fmtTime(date) {
  return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function getTimeline(order) {
  const placed = new Date(order.createdAt);
  return [
    {
      key: 'Placed',
      label: 'Order Placed',
      sub: `Confirmed on ${fmt(placed)} at ${fmtTime(placed)}`,
      icon: '🛍️',
      done: true,
      date: placed
    },
    {
      key: 'Processing',
      label: 'Order Processing',
      sub: 'Seller is preparing your books for dispatch',
      icon: '⚙️',
      done: ['Processing', 'Shipped', 'Out for Delivery', 'Delivered'].includes(order.status),
      date: addDays(placed, 1)
    },
    {
      key: 'Shipped',
      label: 'Shipped',
      sub: 'Package handed over to delivery partner',
      icon: '📦',
      done: ['Shipped', 'Out for Delivery', 'Delivered'].includes(order.status),
      date: addDays(placed, 2)
    },
    {
      key: 'Out for Delivery',
      label: 'Out for Delivery',
      sub: order.status === 'Out for Delivery' || order.status === 'Delivered'
        ? `Delivery agent on the way — call: +91 98765 43210`
        : `Expected ${fmt(addDays(placed, 4))}`,
      icon: '🚚',
      done: ['Out for Delivery', 'Delivered'].includes(order.status),
      date: addDays(placed, 4)
    },
    {
      key: 'Delivered',
      label: 'Delivered',
      sub: order.status === 'Delivered'
        ? `Successfully delivered`
        : `Expected by ${fmt(addDays(placed, 5))}`,
      icon: '✅',
      done: order.status === 'Delivered',
      date: addDays(placed, 5)
    }
  ];
}

function daysSinceOrder(order) {
  return Math.floor((Date.now() - new Date(order.createdAt)) / 86400000);
}

/* ── component ── */
export default function OrderSuccess() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const timelineRef = useRef(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // action feedback
  const [actionMsg, setActionMsg] = useState({ text: '', type: 'success' });
  // cancel
  const [cancelling, setCancelling] = useState(false);
  // address modal
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addrFields, setAddrFields] = useState({});
  const [addrSaving, setAddrSaving] = useState(false);
  // exchange modal
  const [showExchangeForm, setShowExchangeForm] = useState(false);
  const [exchangeReason, setExchangeReason] = useState('');
  const [exchangeSaving, setExchangeSaving] = useState(false);

  useEffect(() => {
    if (!id || !token) return;
    (async () => {
      try {
        setLoading(true);
        const data = await api.get(`/api/orders/${id}`, { token });
        setOrder(data);
        setAddrFields(data.shippingInfo || {});
      } catch (err) {
        setError(err.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, token]);

  const showMsg = (text, type = 'success') => setActionMsg({ text, type });

  // ── Track: scroll to timeline
  const handleTrack = () => {
    timelineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Cancel
  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order? This cannot be undone.')) return;
    setCancelling(true);
    try {
      await api.patch(`/api/orders/${id}/cancel`, {}, { token });
      setOrder(prev => ({ ...prev, status: 'Cancelled' }));
      showMsg('✅ Order cancelled successfully.');
    } catch (err) {
      showMsg(err.message || 'Failed to cancel order.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  // ── Address update
  const handleSaveAddress = async () => {
    const { address, city, state, postal } = addrFields;
    if (!address || !city || !state || !postal) {
      showMsg('Please fill address, city, state and postal code.', 'error');
      return;
    }
    setAddrSaving(true);
    try {
      const updated = await api.patch(`/api/orders/${id}/address`, addrFields, { token });
      setOrder(prev => ({ ...prev, shippingInfo: updated.order?.shippingInfo || addrFields }));
      setShowAddressForm(false);
      showMsg('✅ Shipping address updated successfully.');
    } catch (err) {
      showMsg(err.message || 'Failed to update address.', 'error');
    } finally {
      setAddrSaving(false);
    }
  };

  // ── Exchange
  const handleExchange = async () => {
    if (!exchangeReason.trim()) {
      showMsg('Please describe the reason for exchange/return.', 'error');
      return;
    }
    setExchangeSaving(true);
    try {
      await api.post(`/api/orders/${id}/exchange`, { reason: exchangeReason }, { token });
      setShowExchangeForm(false);
      showMsg('✅ Exchange request submitted! Our team will contact you within 24 hours.');
    } catch (err) {
      showMsg(err.message || 'Failed to submit exchange request.', 'error');
    } finally {
      setExchangeSaving(false);
    }
  };

  if (loading) return (
    <div className="os-page">
      <Navbar />
      <main className="os-loading">
        <div className="os-spinner" />
        <p>Loading your order…</p>
      </main>
      <Footer />
    </div>
  );

  if (error) return (
    <div className="os-page">
      <Navbar />
      <main className="os-loading">
        <div className="os-error-box">
          <span>⚠️</span>
          <p>{error}</p>
          <Link to="/user/dashboard" className="os-btn-primary">Go to Dashboard</Link>
        </div>
      </main>
      <Footer />
    </div>
  );

  if (!order) return null;

  const timeline = getTimeline(order);
  const daysSince = daysSinceOrder(order);
  const canCancel = daysSince <= 2 && !['Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].includes(order.status);
  const canExchange = order.status === 'Delivered';
  const canChangeAddress = daysSince <= 2 && ['Placed', 'Processing'].includes(order.status);
  const isOutForDelivery = order.status === 'Out for Delivery';
  const isCancelled = order.status === 'Cancelled';
  const si = order.shippingInfo || {};
  const estDelivery = addDays(order.createdAt, 5);
  const currentStepIdx = STATUS_STEPS.findIndex(s => s === order.status);

  return (
    <div className="os-page">
      <Navbar />
      <main className="os-container">

        {/* ── Hero Banner ── */}
        <div className={`os-hero ${isCancelled ? 'cancelled' : ''}`}>
          <div className="os-hero-icon">{isCancelled ? '❌' : '🎉'}</div>
          <div>
            <h1>{isCancelled ? 'Order Cancelled' : 'Order Confirmed!'}</h1>
            <p>{isCancelled ? 'Your order has been cancelled.' : 'Thank you! Your books are on their way.'}</p>
          </div>
          <div className="os-order-badge">
            <span className="os-badge-label">Order ID</span>
            <span className="os-badge-id">#{String(order._id).slice(-8).toUpperCase()}</span>
          </div>
        </div>

        {order.items?.some(i => i.format === 'digital') && !isCancelled && (
          <div className="os-card" style={{ background: 'linear-gradient(135deg, #fdf4ef, #fff)', border: '2px solid #b4512d', marginBottom: '1.5rem' }}>
            <div className="flex items-center gap-4">
              <span style={{ fontSize: '2rem' }}>📚</span>
              <div>
                <h3 style={{ color: '#b4512d', fontWeight: 800, margin: 0 }}>Digital Access Ready!</h3>
                <p style={{ margin: '0.2rem 0 0.8rem', fontSize: '0.9rem', color: '#7a726b' }}>Your softcopy books have been added to your digital library.</p>
                <Link to="/user/dashboard" className="os-btn-primary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.8rem' }}>Go to My Digital Library</Link>
              </div>
            </div>
          </div>
        )}

        <div className="os-layout">
          {/* ── LEFT COLUMN ── */}
          <div className="os-left">

            {/* Timeline */}
            {!isCancelled && (
              <div className="os-card" ref={timelineRef}>
                <div className="os-card-title">
                  <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/></svg>
                  Delivery Timeline
                </div>
                <div className="os-timeline">
                  {timeline.map((step, idx) => {
                    const isActive = step.key === order.status;
                    const isLast = idx === timeline.length - 1;
                    return (
                      <div key={step.key} className={`os-tl-row${step.done ? ' done' : ''}${isActive ? ' active' : ''}`}>
                        <div className="os-tl-left">
                          <div className={`os-tl-dot${step.done ? ' done' : ''}${isActive ? ' active' : ''}`}>
                            {step.done ? (
                              <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            ) : (
                              <span>{idx + 1}</span>
                            )}
                          </div>
                          {!isLast && <div className={`os-tl-line${step.done ? ' done' : ''}`} />}
                        </div>
                        <div className="os-tl-content">
                          <div className="os-tl-icon">{step.icon}</div>
                          <div>
                            <div className={`os-tl-label${isActive ? ' active' : ''}`}>{step.label}</div>
                            <div className="os-tl-sub">{step.sub}</div>
                            <div className="os-tl-date">{fmt(step.date)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {!isCancelled && (
                  <div className="os-delivery-banner" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="1.8"/><circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="1.8"/></svg>
                      <span>Estimated Delivery: <strong>{order.estimatedDeliveryDate ? fmt(order.estimatedDeliveryDate) : fmt(estDelivery)}</strong></span>
                    </div>
                    {order.courierPartner && order.courierPartner !== 'Self' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', fontSize: '0.9rem', color: '#1d1b19' }}>
                        <span style={{ fontWeight: 600 }}>Delivery Partner:</span> {order.courierPartner}
                        {order.trackingId && (
                          <>
                            <span style={{ color: '#a88874', margin: '0 0.3rem' }}>|</span>
                            <span style={{ fontWeight: 600 }}>Tracking ID:</span> 
                            <a href={`https://track.pustakly.com/${order.trackingId}`} target="_blank" rel="noreferrer" style={{ color: '#b4512d', textDecoration: 'none', fontWeight: 600 }}>
                              {order.trackingId}
                            </a>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Delivery Agent (Out for Delivery) */}
            {(isOutForDelivery || order.status === 'Delivered') && order.deliveryAgent && order.deliveryAgent.name && (
              <div className="os-card os-agent-card">
                <div className="os-card-title">
                  <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  Delivery Partner
                </div>
                <div className="os-agent-row">
                  <div className="os-agent-avatar">{order.deliveryAgent.name[0].toUpperCase()}</div>
                  <div>
                    <div className="os-agent-name">{order.deliveryAgent.name}</div>
                    <div className="os-agent-sub">{order.courierPartner !== 'Self' ? order.courierPartner : 'Pustakly Logistics'} · Vehicle: {order.deliveryAgent.vehicle}</div>
                  </div>
                  <div className="os-agent-actions">
                    <a href={`tel:${order.deliveryAgent.phone}`} className="os-icon-btn call">
                      <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2a1 1 0 011-.25 11.4 11.4 0 003.6.6 1 1 0 011 1V21a1 1 0 01-1 1A17 17 0 013 5a1 1 0 011-1h3.5a1 1 0 011 1 11.4 11.4 0 00.6 3.6 1 1 0 01-.25 1L6.6 10.8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                      Call
                    </a>
                    <a href={`sms:${order.deliveryAgent.phone}`} className="os-icon-btn sms">
                      <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      SMS
                    </a>
                  </div>
                </div>
                <div className="os-track-live">
                  <span className="os-live-dot" style={order.status === 'Delivered' ? { background: '#16a34a', boxShadow: 'none' } : {}} />
                  {order.status === 'Delivered' 
                    ? `Delivered by ${order.deliveryAgent.name}` 
                    : `Agent is ${order.deliveryAgent.liveDistance} · Arriving in ${order.deliveryAgent.estimatedArrival}`
                  }
                </div>
              </div>
            )}

            {/* Shipping Details */}
            <div className="os-card">
              <div className="os-card-title">
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2C20 17.5 12 22 12 22z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/></svg>
                Shipping Address
              </div>
              <div className="os-address-grid">
                <div className="os-addr-row">
                  <span className="os-addr-label">Name</span>
                  <span className="os-addr-val">{si.firstName} {si.lastName}</span>
                </div>
                <div className="os-addr-row">
                  <span className="os-addr-label">Address</span>
                  <span className="os-addr-val">{si.address}</span>
                </div>
                <div className="os-addr-row">
                  <span className="os-addr-label">City / State</span>
                  <span className="os-addr-val">{si.city}, {si.state} — {si.postal}</span>
                </div>
                <div className="os-addr-row">
                  <span className="os-addr-label">Phone</span>
                  <span className="os-addr-val">{si.phone}</span>
                </div>
                <div className="os-addr-row">
                  <span className="os-addr-label">Payment</span>
                  <span className="os-addr-val os-payment-badge">
                    {order.paymentMethod === 'card' ? '💳 Card' : order.paymentMethod === 'upi' ? '📱 UPI' : '💵 Cash on Delivery'}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="os-card">
              <div className="os-card-title">
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="2"/></svg>
                Items Ordered
              </div>
              <div className="os-items-list">
                {(order.items || []).map((item, idx) => (
                  <div key={idx} className="os-item-row">
                    <div className="os-item-avatar">{(item.title || 'B')[0].toUpperCase()}</div>
                    <div className="os-item-info">
                      <div className="os-item-title">{item.title}</div>
                      <div className="os-item-qty">Qty: {item.quantity}</div>
                    </div>
                    <div className="os-item-price">₹{(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>
              <div className="os-totals">
                <div className="os-total-row"><span>Subtotal</span><span>₹{order.subtotal?.toFixed(2)}</span></div>
                <div className="os-total-row"><span>Taxes</span><span>₹{order.tax?.toFixed(2)}</span></div>
                <div className="os-total-row"><span>Shipping</span><span className={order.shippingCost === 0 ? 'os-free' : ''}>
                  {order.shippingCost === 0 ? 'Free' : `₹${order.shippingCost}`}
                </span></div>
                <div className="os-divider" />
                <div className="os-total-row os-grand-total"><span>Total Paid</span><span>₹{order.total?.toFixed(2)}</span></div>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="os-right">

            {/* Status Badge */}
            <div className="os-card os-status-card">
              <div className="os-card-title">Order Status</div>
              <div className={`os-status-pill ${order.status?.toLowerCase().replace(/ /g, '-')}`}>
                {order.status}
              </div>
              <div className="os-status-note">
                {isCancelled ? 'This order has been cancelled.' :
                  order.status === 'Delivered' ? 'Your order was delivered successfully.' :
                  `Estimated delivery by ${fmt(estDelivery)}`}
              </div>
            </div>

            {/* Action Centre */}
            <div className="os-card">
              <div className="os-card-title">
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                Manage Order
              </div>

              {actionMsg.text && (
                <div className={`os-action-msg ${actionMsg.type === 'error' ? 'error' : ''}`}>
                  {actionMsg.text}
                </div>
              )}

              <div className="os-actions-list">
                {/* Track — scrolls to timeline */}
                <div className="os-action-item">
                  <div className="os-action-icon track">📍</div>
                  <div className="os-action-info">
                    <div className="os-action-label">Track Order</div>
                    <div className="os-action-sub">Scroll to live delivery timeline</div>
                  </div>
                  <button className="os-action-btn" onClick={handleTrack}>View</button>
                </div>

                {/* Cancel — calls API */}
                {canCancel && (
                  <div className="os-action-item">
                    <div className="os-action-icon cancel">❌</div>
                    <div className="os-action-info">
                      <div className="os-action-label">Cancel Order</div>
                      <div className="os-action-sub">Available within 2 days of ordering</div>
                    </div>
                    <button className="os-action-btn danger" onClick={handleCancel} disabled={cancelling}>
                      {cancelling ? (
                        <span className="os-btn-spin">⟳</span>
                      ) : 'Cancel'}
                    </button>
                  </div>
                )}

                {/* Change Address — opens inline form */}
                {canChangeAddress && (
                  <div className="os-action-item-wrap">
                    <div className="os-action-item">
                      <div className="os-action-icon address">🏠</div>
                      <div className="os-action-info">
                        <div className="os-action-label">Change Address</div>
                        <div className="os-action-sub">Update within 2 days of ordering</div>
                      </div>
                      <button
                        className={`os-action-btn${showAddressForm ? ' active' : ''}`}
                        onClick={() => setShowAddressForm(v => !v)}
                      >
                        {showAddressForm ? 'Close' : 'Update'}
                      </button>
                    </div>
                    {showAddressForm && (
                      <div className="os-inline-form">
                        <div className="os-form-grid">
                          {[
                            { name: 'firstName', placeholder: 'First Name' },
                            { name: 'lastName',  placeholder: 'Last Name'  },
                          ].map(f => (
                            <input key={f.name} className="os-fi" placeholder={f.placeholder}
                              value={addrFields[f.name] || ''}
                              onChange={e => setAddrFields(p => ({ ...p, [f.name]: e.target.value }))} />
                          ))}
                          <input className="os-fi full" placeholder="Street Address"
                            value={addrFields.address || ''}
                            onChange={e => setAddrFields(p => ({ ...p, address: e.target.value }))} />
                          <input className="os-fi" placeholder="City"
                            value={addrFields.city || ''}
                            onChange={e => setAddrFields(p => ({ ...p, city: e.target.value }))} />
                          <input className="os-fi" placeholder="State"
                            value={addrFields.state || ''}
                            onChange={e => setAddrFields(p => ({ ...p, state: e.target.value }))} />
                          <input className="os-fi" placeholder="Postal Code"
                            value={addrFields.postal || ''}
                            onChange={e => setAddrFields(p => ({ ...p, postal: e.target.value }))} />
                          <input className="os-fi" placeholder="Phone"
                            value={addrFields.phone || ''}
                            onChange={e => setAddrFields(p => ({ ...p, phone: e.target.value }))} />
                        </div>
                        <button className="os-save-btn" onClick={handleSaveAddress} disabled={addrSaving}>
                          {addrSaving ? 'Saving…' : '💾 Save Address'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Exchange / Return — opens reason form */}
                {canExchange && (
                  <div className="os-action-item-wrap">
                    <div className="os-action-item">
                      <div className="os-action-icon exchange">🔄</div>
                      <div className="os-action-info">
                        <div className="os-action-label">Exchange / Return</div>
                        <div className="os-action-sub">Request within 7 days of delivery</div>
                      </div>
                      <button
                        className={`os-action-btn${showExchangeForm ? ' active' : ''}`}
                        onClick={() => setShowExchangeForm(v => !v)}
                      >
                        {showExchangeForm ? 'Close' : 'Request'}
                      </button>
                    </div>
                    {showExchangeForm && (
                      <div className="os-inline-form">
                        <textarea
                          className="os-textarea"
                          rows={3}
                          placeholder="Describe the reason for exchange or return (e.g. damaged, wrong item)…"
                          value={exchangeReason}
                          onChange={e => setExchangeReason(e.target.value)}
                        />
                        <button className="os-save-btn" onClick={handleExchange} disabled={exchangeSaving}>
                          {exchangeSaving ? 'Submitting…' : '📤 Submit Request'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Customer Support — real mailto link */}
                <div className="os-action-item">
                  <div className="os-action-icon support">🎧</div>
                  <div className="os-action-info">
                    <div className="os-action-label">Customer Support</div>
                    <div className="os-action-sub">Mon–Sat 9 AM – 6 PM · support@pustakly.com</div>
                  </div>
                  <a
                    href={`mailto:support@pustakly.com?subject=Order%20%23${String(order._id).slice(-8).toUpperCase()}&body=Hi%20Pustakly%20Support%2C%0A%0AI%20have%20an%20issue%20with%20my%20order%20%23${String(order._id).slice(-8).toUpperCase()}.%0A%0A`}
                    className="os-action-btn"
                  >
                    Email
                  </a>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="os-cta-group">
              <Link to="/user/dashboard" className="os-btn-primary">
                <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><rect x="3" y="3" width="7" height="7" rx="1" stroke="white" strokeWidth="2"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="white" strokeWidth="2"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="white" strokeWidth="2"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="white" strokeWidth="2"/></svg>
                Go to Dashboard
              </Link>
              <Link to="/marketplace" className="os-btn-secondary">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
