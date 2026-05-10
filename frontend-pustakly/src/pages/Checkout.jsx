import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../lib/api.js';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import './Checkout.css';

const PAYMENT_OPTIONS = [
  {
    id: 'razorpay',
    label: 'Razorpay',
    sub: 'UPI · Cards · Wallets · Net Banking',
    badge: 'RECOMMENDED',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="pay-icon">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    id: 'card',
    label: 'Credit / Debit Card',
    sub: 'Visa · Mastercard · RuPay · Amex',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="pay-icon">
        <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M2 10H22" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="5" y="13.5" width="4" height="2" rx="0.5" fill="currentColor"/>
      </svg>
    )
  },
  {
    id: 'upi',
    label: 'UPI',
    sub: 'Google Pay · PhonePe · Paytm · BHIM',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="pay-icon">
        <path d="M12 3L4 8V16L12 21L20 16V8L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    id: 'stripe',
    label: 'Stripe',
    sub: 'International cards · Multi-currency',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="pay-icon">
        <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M9 9C9 8.4 9.9 8 11 8C12.5 8 13.5 8.8 13.5 8.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M15 15C15 15.6 14.1 16 13 16C11.5 16 10.5 15.2 10.5 15.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M13.5 8.8L10.5 15.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: 'paypal',
    label: 'PayPal',
    sub: 'Pay with your PayPal balance',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="pay-icon">
        <path d="M17.5 7C17.5 10.5 15 12 12 12H10L9 17H6L8 7H13C15.5 7 17.5 8 17.5 7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M19 5C19 8.5 16.5 10 13.5 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: 'wallet',
    label: 'Wallet',
    sub: 'Paytm · Amazon Pay · Mobikwik',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="pay-icon">
        <path d="M21 7H3C2.4 7 2 7.4 2 8V19C2 19.6 2.4 20 3 20H21C21.6 20 22 19.6 22 19V8C22 7.4 21.6 7 21 7Z" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M16 7V5C16 4.4 15.6 4 15 4H5C4.4 4 4 4.4 4 5V7" stroke="currentColor" strokeWidth="1.8"/>
        <circle cx="17" cy="13.5" r="1.5" fill="currentColor"/>
      </svg>
    )
  },
  {
    id: 'cod',
    label: 'Cash on Delivery',
    sub: 'Pay when your order arrives',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="pay-icon">
        <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M12 10V14M10 12H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M3 10H21" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    )
  },
  {
    id: 'bank',
    label: 'Direct Bank Transfer',
    sub: 'Transfer to our HDFC / SBI account',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="pay-icon">
        <path d="M3 21H21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M4 10V18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M10 10V18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M14 10V18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M20 10V18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M12 3L2 8V10H22V8L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      </svg>
    )
  }
];

export default function Checkout() {
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [fields, setFields] = useState({
    firstName: '', lastName: '', address: '', city: '',
    state: '', postal: '', phone: ''
  });
  const [cardFields, setCardFields] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [upiId, setUpiId] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [rates, setRates] = useState({ INR: 1, USD: 0.012, EUR: 0.011, GBP: 0.0095 });
  
  // Logistics
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [shippingRates, setShippingRates] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  
  // Payment Admin Settings
  const [adminPaymentSettings, setAdminPaymentSettings] = useState(null);

  const { items, clearCart } = useContext(CartContext);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/payment/currencies').then(res => { if (res.rates) setRates(res.rates); }).catch(console.error);
    api.get('/api/payment/settings').then(res => setAdminPaymentSettings(res)).catch(console.error);
    if (token) {
      api.get('/api/shipping/addresses', { token }).then(res => {
        if (res.addresses) setSavedAddresses(res.addresses);
      }).catch(console.error);
    }
  }, [token]);

  // Fetch Shipping Rates
  useEffect(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    api.post('/api/shipping/rates', { destinationCountry: 'India', weightKg: 1.5, orderValue: subtotal })
      .then(res => {
        if (res.rates && res.rates.length > 0) {
          setShippingRates(res.rates);
          setSelectedShipping(res.rates[0]);
        }
      }).catch(console.error);
  }, [items]);

  const GST_RATE = 0.18;
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = selectedShipping ? selectedShipping.cost : (subtotal > 499 ? 0 : 49);
  const tax = Math.round(subtotal * GST_RATE * 100) / 100;
  const total = Math.round((subtotal + shipping + tax) * 100) / 100;

  const handleSavedAddress = (e) => {
    const addr = savedAddresses.find(a => a._id === e.target.value);
    if (addr) {
      setFields({
        firstName: addr.firstName || '', lastName: addr.lastName || '',
        address: addr.addressLine1 || '', city: addr.city || '',
        state: addr.state || '', postal: addr.postalCode || '', phone: addr.phone || ''
      });
    }
  };

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
    if (!fields.firstName.trim()) e.firstName = 'Required';
    if (!fields.lastName.trim())  e.lastName  = 'Required';
    if (!fields.address.trim())   e.address   = 'Required';
    if (!fields.city.trim())      e.city      = 'Required';
    if (!fields.state.trim())     e.state     = 'Required';
    if (!fields.postal.trim())    e.postal    = 'Required';
    if (!fields.phone.trim())     e.phone     = 'Required';
    if (paymentMethod === 'card') {
      if (!cardFields.number || cardFields.number.replace(/\s/g, '').length < 16) e.number = 'Invalid card number';
      if (!cardFields.expiry || cardFields.expiry.length < 5) e.expiry = 'Invalid expiry';
      if (!cardFields.cvv   || cardFields.cvv.length < 3)    e.cvv    = 'Invalid CVV';
      if (!cardFields.name.trim()) e.cardName = 'Required';
    }
    if (paymentMethod === 'upi') {
      if (!upiId.trim() || !/^[\w.\-]+@[\w]+$/.test(upiId.trim())) e.upiId = 'Invalid UPI ID';
    }
    if (!items || items.length === 0) e.cart = 'Your cart is empty.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;
    if (!token) { setApiError('Please log in to place an order.'); return; }

    setLoading(true);
    setApiError('');
    try {
      // 1. Create the order first
      const orderPayload = {
        items: items.map(i => ({ 
          productId: i.productId, 
          title: i.title, 
          price: i.price, 
          quantity: i.quantity,
          format: i.format || 'physical'
        })),
        shippingInfo: fields,
        paymentMethod,
        subtotal, tax, shippingCost: shipping, total,
        courierPartner: selectedShipping ? selectedShipping.partner : 'Self'
      };
      const orderResult = await api.post('/api/orders', orderPayload, { token });
      const orderId = orderResult.orderId || orderResult._id;

      // 2. Route to correct payment gateway
      if (paymentMethod === 'razorpay') {
        const rzpData = await api.post('/api/payment/razorpay/create', { orderId, currency }, { token });
        // Load Razorpay SDK dynamically
        await loadRazorpayScript();
        const rzp = new window.Razorpay({
          key: rzpData.keyId,
          amount: rzpData.amount,
          currency: rzpData.currency,
          order_id: rzpData.razorpayOrderId,
          name: 'Pustakly',
          description: 'Book Purchase',
          handler: async (response) => {
            await api.post('/api/payment/razorpay/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              paymentId: rzpData.paymentId
            }, { token });
            clearCart();
            navigate(`/order-success/${orderId}`);
          },
          prefill: { name: `${fields.firstName} ${fields.lastName}`, contact: fields.phone },
          theme: { color: '#b4512d' }
        });
        rzp.open();
        return; // navigation handled in handler
      }

      if (['cod', 'upi', 'wallet'].includes(paymentMethod)) {
        await api.post('/api/payment/cod', { orderId, gateway: paymentMethod }, { token });
      }

      clearCart();
      navigate(`/order-success/${orderId}`);
    } catch (err) {
      setApiError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpayScript = () => new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    document.head.appendChild(s);
  });

  const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
  const formatPrice = (n) => {
    const rate = rates[currency] || 1;
    return `${symbols[currency] || '₹'}${(Number(n) * rate).toFixed(2)}`;
  };

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
              
              {savedAddresses.length > 0 && (
                <div className="input-group" style={{ marginBottom: '1.5rem', gridColumn: '1 / -1' }}>
                  <label className="input-label">Use Saved Address</label>
                  <select className="input-field" onChange={handleSavedAddress} defaultValue="">
                    <option value="" disabled>Select an address...</option>
                    {savedAddresses.map(a => (
                      <option key={a._id} value={a._id}>{a.label} - {a.addressLine1}, {a.city}</option>
                    ))}
                  </select>
                </div>
              )}

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

            {/* Delivery Options */}
            <div className="form-section">
              <div className="section-title">
                <span className="section-badge">2</span>
                <h2>Delivery Partner</h2>
              </div>
              <div className="payment-options">
                {shippingRates.map(rate => (
                  <label key={rate.partner} className={`pay-tile ${selectedShipping?.partner === rate.partner ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="delivery" 
                      className="pay-radio" 
                      checked={selectedShipping?.partner === rate.partner} 
                      onChange={() => setSelectedShipping(rate)} 
                    />
                    <div className="pay-tile-content">
                      <div className="pay-tile-header">
                        <span className="pay-tile-label">{rate.partner}</span>
                        {rate.cost === 0 && <span className="pay-tile-badge">FREE</span>}
                      </div>
                      <div className="pay-tile-sub">Est. {rate.estimatedDays} Days · {formatPrice(rate.cost)}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Payment */}
            <div className="form-section">
              <div className="section-title">
                <span className="section-badge">3</span>
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
                      <div className="pay-tile-label-row">
                        <span className="pay-tile-label">{opt.label}</span>
                        {opt.badge && <span className="pay-tile-badge">{opt.badge}</span>}
                      </div>
                      <span className="pay-tile-sub">{opt.sub}</span>
                    </div>
                    <div className={`pay-tile-radio${paymentMethod === opt.id ? ' checked' : ''}`}>
                      {paymentMethod === opt.id && <span className="pay-tile-dot" />}
                    </div>
                  </button>
                ))}
              </div>

              {/* Razorpay Info */}
              {paymentMethod === 'razorpay' && (
                <div className="pay-detail-section">
                  <div className="gateway-banner razorpay">
                    <strong>Razorpay Checkout</strong>
                    <p>A secure popup will open when you click "Place Order" where you can pay using any UPI app, Card, or Netbanking.</p>
                  </div>
                </div>
              )}

              {/* Stripe Info */}
              {paymentMethod === 'stripe' && (
                <div className="pay-detail-section">
                  <div className="gateway-banner stripe">
                    <strong>Stripe Secure Gateway</strong>
                    <p>You will be redirected to Stripe to securely complete your payment. Supports international cards and multi-currency.</p>
                  </div>
                </div>
              )}

              {/* PayPal Info */}
              {paymentMethod === 'paypal' && (
                <div className="pay-detail-section">
                  <div className="gateway-banner paypal">
                    <strong>PayPal</strong>
                    <p>You will be redirected to PayPal. Log in to your PayPal account to complete the purchase securely.</p>
                  </div>
                </div>
              )}

              {/* Wallet Info */}
              {paymentMethod === 'wallet' && (
                <div className="pay-detail-section">
                  <div className="gateway-banner wallet">
                    <strong>Mobile Wallet</strong>
                    <p>Supported wallets: Paytm, Amazon Pay, PhonePe, Freecharge. You will authenticate on the next screen.</p>
                  </div>
                </div>
              )}

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
                  <div className="gateway-banner upi" style={{ background: '#fdfaf8', border: '1px solid #e8ddd4', borderRadius: '12px', padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
                      <svg viewBox="0 0 24 24" fill="none" width="24" height="24"><path d="M12 3L4 8V16L12 21L20 16V8L12 3Z" stroke="#b4512d" strokeWidth="1.8" strokeLinejoin="round"/></svg>
                      <strong style={{ color: '#1d1b19', fontSize: '1.1rem' }}>Manual UPI Transfer</strong>
                    </div>
                    {adminPaymentSettings ? (
                      <div style={{ marginTop: '0.8rem', fontSize: '0.9rem', color: '#6f6861', lineHeight: '1.6' }}>
                        <p style={{ margin: '0 0 0.4rem' }}>Please send the exact total amount to our business UPI ID below:</p>
                        <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px dashed #c1b3a8', padding: '0.6rem 1rem', borderRadius: '8px', margin: '0.6rem 0' }}>
                          <span style={{ fontWeight: 700, color: '#1d1b19', fontSize: '1.05rem', letterSpacing: '0.5px' }}>{adminPaymentSettings.upiId}</span>
                        </div>
                        <p style={{ margin: '0.4rem 0 0' }}><strong>Name:</strong> {adminPaymentSettings.upiName}</p>
                        <p style={{ margin: '0.4rem 0 0', fontStyle: 'italic', color: '#a88874' }}>{adminPaymentSettings.instructions}</p>
                      </div>
                    ) : (
                      <p>Loading UPI Details...</p>
                    )}
                  </div>
                </div>
              )}

              {/* Direct Bank Transfer Field */}
              {paymentMethod === 'bank' && (
                <div className="pay-detail-section">
                  <div className="gateway-banner bank" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
                      <svg viewBox="0 0 24 24" fill="none" width="24" height="24"><path d="M3 21H21" stroke="#334155" strokeWidth="1.8" strokeLinecap="round"/><path d="M4 10V18" stroke="#334155" strokeWidth="1.8" strokeLinecap="round"/><path d="M12 3L2 8V10H22V8L12 3Z" stroke="#334155" strokeWidth="1.8" strokeLinejoin="round"/></svg>
                      <strong style={{ color: '#0f172a', fontSize: '1.1rem' }}>NEFT / RTGS / IMPS</strong>
                    </div>
                    {adminPaymentSettings ? (
                      <div style={{ marginTop: '0.8rem', fontSize: '0.9rem', color: '#475569', lineHeight: '1.6' }}>
                        <p style={{ margin: '0 0 0.8rem' }}>Please transfer the exact total amount to our verified bank account:</p>
                        <div style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Bank Name:</span> <strong>{adminPaymentSettings.bankName}</strong></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Account Number:</span> <strong style={{ fontSize: '1.05rem', letterSpacing: '0.5px', color: '#0f172a' }}>{adminPaymentSettings.accountNumber}</strong></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>IFSC Code:</span> <strong>{adminPaymentSettings.ifscCode}</strong></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Account Name:</span> <strong>{adminPaymentSettings.accountName}</strong></div>
                        </div>
                        <p style={{ margin: '0.8rem 0 0', fontStyle: 'italic', color: '#64748b' }}>{adminPaymentSettings.instructions}</p>
                      </div>
                    ) : (
                      <p>Loading Bank Details...</p>
                    )}
                  </div>
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
            <div className="summary-header">
              <div className="section-title" style={{ marginBottom: 0 }}>
                <span className="section-badge">3</span>
                <h2>Order Summary</h2>
              </div>
              <select className="currency-selector" value={currency} onChange={e => setCurrency(e.target.value)}>
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
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
