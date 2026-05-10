import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../lib/api.js';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import './Checkout.css';

const PAYMENT_OPTIONS = [
  {
    id: 'card',
    label: 'Credit / Debit Card',
    sub: 'Visa, Mastercard, RuPay',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="pay-icon">
        <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M2 10H22" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="5" y="13.5" width="4" height="2" rx="0.5" fill="currentColor"/>
      </svg>
    )
  },
  {
    id: 'upi',
    label: 'UPI',
    sub: 'Google Pay, PhonePe, Paytm',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="pay-icon">
        <path d="M12 3L4 8V16L12 21L20 16V8L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    id: 'cod',
    label: 'Cash on Delivery',
    sub: 'Pay when your order arrives',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="pay-icon">
        <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M12 10V14M10 12H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M3 10H21" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    )
  }
];

export default function Checkout() {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [fields, setFields] = useState({
    firstName: '', lastName: '', address: '', city: '',
    state: '', postal: '', phone: ''
  });
  const [cardFields, setCardFields] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [upiId, setUpiId] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const { items, clearCart } = useContext(CartContext);
  const { token } = useAuth();
  const navigate = useNavigate();

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 499 ? 0 : 49;
  const tax = Math.round(subtotal * 0.06 * 100) / 100;
  const total = Math.round((subtotal + shipping + tax) * 100) / 100;

  const handleField = (e) => {
    setFields(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const handleCardField = (e) => {
    let { name, value } = e.target;
    if (name === 'number') value = value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    if (name === 'expiry') {
      value = value.replace(/\D/g, '').slice(0, 4);
      if (value.length > 2) value = value.slice(0, 2) + '/' + value.slice(2);
    }
    if (name === 'cvv') value = value.replace(/\D/g, '').slice(0, 3);
    setCardFields(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!fields.firstName.trim()) e.firstName = 'First name is required.';
    if (!fields.lastName.trim()) e.lastName = 'Last name is required.';
    if (!fields.address.trim()) e.address = 'Address is required.';
    if (!fields.city.trim()) e.city = 'City is required.';
    if (!fields.state.trim()) e.state = 'State is required.';
    if (!fields.postal.trim()) e.postal = 'Postal code is required.';
    if (!fields.phone.trim()) e.phone = 'Phone is required.';
    else if (!/^\+?\d{10,15}$/.test(fields.phone.replace(/\s+/g, ''))) e.phone = 'Enter a valid phone number.';
    if (paymentMethod === 'card') {
      if (!cardFields.number || cardFields.number.replace(/\s/g, '').length < 16) e.number = 'Enter a valid 16-digit card number.';
      if (!cardFields.expiry || cardFields.expiry.length < 5) e.expiry = 'Enter expiry as MM/YY.';
      if (!cardFields.cvv || cardFields.cvv.length < 3) e.cvv = 'Enter 3-digit CVV.';
      if (!cardFields.name.trim()) e.cardName = 'Cardholder name is required.';
    }
    if (paymentMethod === 'upi') {
      if (!upiId.trim() || !/^[\w.\-]+@[\w]+$/.test(upiId.trim())) e.upiId = 'Enter a valid UPI ID (e.g. name@upi).';
    }
    if (!items || items.length === 0) e.cart = 'Your cart is empty.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;

    if (!token) {
      setApiError('You must be logged in to place an order. Please log in and try again.');
      return;
    }

    setLoading(true);
    setApiError('');
    try {
      const orderPayload = {
        items: items.map(i => ({
          productId: i.productId,
          title: i.title,
          price: i.price,
          quantity: i.quantity
        })),
        shippingInfo: {
          firstName: fields.firstName,
          lastName: fields.lastName,
          address: fields.address,
          city: fields.city,
          state: fields.state,
          postal: fields.postal,
          phone: fields.phone
        },
        paymentMethod,
        subtotal,
        tax,
        shippingCost: shipping,
        total
      };
      // Pass token via options so api.js sends it as Authorization: Bearer <token>
      const result = await api.post('/api/orders', orderPayload, { token });
      clearCart();
      navigate(`/order-success/${result.orderId || result._id}`);
    } catch (err) {
      setApiError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (n) => `₹${Number(n).toFixed(2)}`;

  return (
    <div className="checkout-page">
      <Navbar />
      <main className="checkout-container">
        <div className="checkout-header">
          <div className="checkout-steps">
            <span className="step active">1. Shipping</span>
            <span className="step-divider">›</span>
            <span className="step active">2. Payment</span>
            <span className="step-divider">›</span>
            <span className="step active">3. Confirm</span>
          </div>
          <h1>Checkout</h1>
          <p>Complete your order and enjoy your next read.</p>
        </div>

        <div className="checkout-layout">
          {/* ─── LEFT: Form ─── */}
          <section className="checkout-form">

            {/* Shipping */}
            <div className="form-section">
              <div className="section-title">
                <span className="section-badge">1</span>
                <h2>Shipping Address</h2>
              </div>
              <div className="form-grid">
                {[
                  { name: 'firstName', label: 'First Name', placeholder: 'Asha' },
                  { name: 'lastName', label: 'Last Name', placeholder: 'Patel' },
                ].map(f => (
                  <div key={f.name} className={`input-group${errors[f.name] ? ' invalid' : ''}`}>
                    <label>{f.label}</label>
                    <input name={f.name} type="text" placeholder={f.placeholder} value={fields[f.name]} onChange={handleField} />
                    {errors[f.name] && <span className="error-text">{errors[f.name]}</span>}
                  </div>
                ))}
                <div className={`input-group full${errors.address ? ' invalid' : ''}`}>
                  <label>Address</label>
                  <input name="address" type="text" placeholder="123 Main Street, Apartment 4B" value={fields.address} onChange={handleField} />
                  {errors.address && <span className="error-text">{errors.address}</span>}
                </div>
                {[
                  { name: 'city', label: 'City', placeholder: 'Mumbai' },
                  { name: 'state', label: 'State', placeholder: 'Maharashtra' },
                  { name: 'postal', label: 'Postal Code', placeholder: '400001' },
                  { name: 'phone', label: 'Phone', placeholder: '+91 9876543210' },
                ].map(f => (
                  <div key={f.name} className={`input-group${errors[f.name] ? ' invalid' : ''}`}>
                    <label>{f.label}</label>
                    <input name={f.name} type="text" placeholder={f.placeholder} value={fields[f.name]} onChange={handleField} />
                    {errors[f.name] && <span className="error-text">{errors[f.name]}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Payment */}
            <div className="form-section">
              <div className="section-title">
                <span className="section-badge">2</span>
                <h2>Payment Method</h2>
              </div>
              <div className="payment-tiles">
                {PAYMENT_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`pay-tile${paymentMethod === opt.id ? ' selected' : ''}`}
                    onClick={() => setPaymentMethod(opt.id)}
                  >
                    <div className="pay-tile-icon">{opt.icon}</div>
                    <div className="pay-tile-text">
                      <span className="pay-tile-label">{opt.label}</span>
                      <span className="pay-tile-sub">{opt.sub}</span>
                    </div>
                    <div className={`pay-tile-radio${paymentMethod === opt.id ? ' checked' : ''}`}>
                      {paymentMethod === opt.id && <span className="pay-tile-dot" />}
                    </div>
                  </button>
                ))}
              </div>

              {/* Card Fields */}
              {paymentMethod === 'card' && (
                <div className="pay-detail-section">
                  <div className="card-brands">
                    <span className="card-brand visa">VISA</span>
                    <span className="card-brand mc">MC</span>
                    <span className="card-brand rupay">RuPay</span>
                  </div>
                  <div className="form-grid card-grid">
                    <div className={`input-group full${errors.number ? ' invalid' : ''}`}>
                      <label>Card Number</label>
                      <div className="input-icon-wrap">
                        <svg className="input-icon" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.6"/><path d="M2 10H22" stroke="currentColor" strokeWidth="1.6"/></svg>
                        <input name="number" type="text" inputMode="numeric" placeholder="1234 5678 9012 3456" value={cardFields.number} onChange={handleCardField} />
                      </div>
                      {errors.number && <span className="error-text">{errors.number}</span>}
                    </div>
                    <div className={`input-group${errors.cardName ? ' invalid' : ''}`}>
                      <label>Cardholder Name</label>
                      <input name="name" type="text" placeholder="Asha Patel" value={cardFields.name} onChange={handleCardField} />
                      {errors.cardName && <span className="error-text">{errors.cardName}</span>}
                    </div>
                    <div className={`input-group${errors.expiry ? ' invalid' : ''}`}>
                      <label>Expiry (MM/YY)</label>
                      <input name="expiry" type="text" inputMode="numeric" placeholder="08/27" value={cardFields.expiry} onChange={handleCardField} />
                      {errors.expiry && <span className="error-text">{errors.expiry}</span>}
                    </div>
                    <div className={`input-group${errors.cvv ? ' invalid' : ''}`}>
                      <label>CVV</label>
                      <input name="cvv" type="password" inputMode="numeric" placeholder="•••" value={cardFields.cvv} onChange={handleCardField} />
                      {errors.cvv && <span className="error-text">{errors.cvv}</span>}
                    </div>
                  </div>
                  <div className="secure-badge">
                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M12 3L4 7V12C4 16.4 7.4 20.5 12 21.9C16.6 20.5 20 16.4 20 12V7L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
                    256-bit SSL Encrypted &amp; Secure
                  </div>
                </div>
              )}

              {/* UPI Field */}
              {paymentMethod === 'upi' && (
                <div className="pay-detail-section">
                  <div className={`input-group${errors.upiId ? ' invalid' : ''}`}>
                    <label>UPI ID</label>
                    <div className="input-icon-wrap">
                      <svg className="input-icon" viewBox="0 0 24 24" fill="none"><path d="M12 3L4 8V16L12 21L20 16V8L12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>
                      <input type="text" placeholder="yourname@upi" value={upiId} onChange={e => { setUpiId(e.target.value); setErrors(p => ({ ...p, upiId: '' })); }} />
                    </div>
                    {errors.upiId && <span className="error-text">{errors.upiId}</span>}
                  </div>
                  <p className="upi-note">You will receive a payment request on your UPI app.</p>
                </div>
              )}

              {/* COD Note */}
              {paymentMethod === 'cod' && (
                <div className="cod-info">
                  <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M12 10V14M10 12H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  <p>Pay with cash when your order arrives at your doorstep. No advance payment required.</p>
                </div>
              )}
            </div>
          </section>

          {/* ─── RIGHT: Order Summary ─── */}
          <aside className="checkout-summary">
            <div className="section-title">
              <span className="section-badge">3</span>
              <h2>Order Summary</h2>
            </div>

            {items.length === 0 ? (
              <div className="empty-cart-msg">🛒 Your cart is empty</div>
            ) : (
              <>
                <div className="summary-items-list">
                  {items.map((item, idx) => (
                    <div className="summary-item-row" key={item.productId || idx}>
                      <div className="summary-item-info">
                        <div className="summary-item-avatar">{item.title?.[0]?.toUpperCase() || 'B'}</div>
                        <div>
                          <div className="summary-item-title">{item.title}</div>
                          <div className="summary-item-qty">Qty: {item.quantity}</div>
                        </div>
                      </div>
                      <div className="summary-item-price">{formatPrice(item.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>

                <div className="summary-divider" />

                <div className="summary-rows">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? 'free-tag' : ''}>{shipping === 0 ? '🎉 Free' : formatPrice(shipping)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Taxes (6%)</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                </div>

                <div className="summary-divider" />

                <div className="summary-total">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>

                {shipping > 0 && (
                  <div className="free-shipping-hint">
                    Add ₹{(499 - subtotal).toFixed(2)} more for <strong>free shipping!</strong>
                  </div>
                )}
              </>
            )}

            {errors.cart && <div className="error-text" style={{ marginBottom: 8 }}>{errors.cart}</div>}
            {apiError && <div className="error-banner-sm">{apiError}</div>}

            <button
              className={`place-order-btn${loading ? ' loading' : ''}`}
              type="button"
              onClick={handlePlaceOrder}
              disabled={loading || items.length === 0}
            >
              {loading ? (
                <span className="btn-spinner">
                  <svg width="20" height="20" viewBox="0 0 44 44" fill="none">
                    <circle cx="22" cy="22" r="20" stroke="rgba(255,255,255,0.4)" strokeWidth="4"/>
                    <path d="M42 22C42 11 33 2 22 2" stroke="white" strokeWidth="4" strokeLinecap="round">
                      <animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" dur="0.7s" from="0 22 22" to="360 22 22"/>
                    </path>
                  </svg>
                  Placing Order…
                </span>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 12V22H4V12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 7H2V12H22V7Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 22V7M12 7H7.5C6.1 7 5 5.9 5 4.5C5 3.1 6.1 2 7.5 2C10 2 12 7 12 7ZM12 7H16.5C17.9 7 19 5.9 19 4.5C19 3.1 17.9 2 16.5 2C14 2 12 7 12 7Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Confirm &amp; Place Order
                </>
              )}
            </button>

            <div className="summary-footer-note">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 3L4 7V12C4 16.4 7.4 20.5 12 21.9C16.6 20.5 20 16.4 20 12V7L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
              Secure checkout · By placing your order, you agree to our <a href="#">Terms &amp; Conditions</a>.
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
