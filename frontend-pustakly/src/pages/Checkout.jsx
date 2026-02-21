
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../lib/api.js';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import './Checkout.css';


export default function Checkout() {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [fields, setFields] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    postal: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { items, clearCart } = useContext(CartContext);
  const { token } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const nextErrors = {};
    if (!fields.firstName.trim()) nextErrors.firstName = 'First name is required.';
    if (!fields.lastName.trim()) nextErrors.lastName = 'Last name is required.';
    if (!fields.address.trim()) nextErrors.address = 'Address is required.';
    if (!fields.city.trim()) nextErrors.city = 'City is required.';
    if (!fields.state.trim()) nextErrors.state = 'State is required.';
    if (!fields.postal.trim()) nextErrors.postal = 'Postal code is required.';
    if (!fields.phone.trim()) nextErrors.phone = 'Phone is required.';
    else if (!/^\+?\d{10,15}$/.test(fields.phone.replace(/\s+/g, ''))) nextErrors.phone = 'Enter a valid phone number.';
    if (!paymentMethod) nextErrors.paymentMethod = 'Select a payment method.';
    if (!items || items.length === 0) nextErrors.cart = 'Your cart is empty.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleField = (e) => {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // Prepare order payload
      const shippingInfo = {
        firstName: fields.firstName,
        lastName: fields.lastName,
        address: fields.address,
        city: fields.city,
        state: fields.state,
        postal: fields.postal,
        phone: fields.phone
      };
      const orderItems = items.map(item => ({
        productId: item.productId,
        title: item.title,
        price: item.price,
        quantity: item.quantity
      }));
      // Calculate subtotal, tax, total
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const tax = Math.round(subtotal * 0.06 * 100) / 100; // 6% tax
      const total = Math.round((subtotal + tax) * 100) / 100;
      // Payment details (for demo, not storing sensitive info)
      const paymentDetails = {};
      // Send order to backend
      const res = await api.post(
        '/api/orders',
        {
          items: orderItems,
          shippingInfo,
          paymentMethod,
          paymentDetails,
          subtotal,
          tax,
          total
        },
        { token }
      );
      await clearCart();
      navigate(`/order-success/${res.orderId}`);
    } catch (err) {
      setErrors((prev) => ({ ...prev, api: err.message || 'Order failed' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <Navbar />
      <main className="checkout-container">
        <div className="checkout-header">
          <h1>Checkout</h1>
          <p>Complete your order and enjoy your next read.</p>
        </div>

        <div className="checkout-layout">
          <section className="checkout-form">
            <div className="form-section">
              <h2>Shipping Address</h2>
              <div className="form-grid">
                <div className={`input-group${errors.firstName ? ' invalid' : ''}`}>
                  <label>First Name</label>
                  <input name="firstName" type="text" placeholder="Asha" value={fields.firstName} onChange={handleField} />
                  {errors.firstName && <span className="error-text">{errors.firstName}</span>}
                </div>
                <div className={`input-group${errors.lastName ? ' invalid' : ''}`}>
                  <label>Last Name</label>
                  <input name="lastName" type="text" placeholder="Patel" value={fields.lastName} onChange={handleField} />
                  {errors.lastName && <span className="error-text">{errors.lastName}</span>}
                </div>
                <div className={`input-group full${errors.address ? ' invalid' : ''}`}>
                  <label>Street Address</label>
                  <input name="address" type="text" placeholder="221B Linden Lane" value={fields.address} onChange={handleField} />
                  {errors.address && <span className="error-text">{errors.address}</span>}
                </div>
                <div className={`input-group${errors.city ? ' invalid' : ''}`}>
                  <label>City</label>
                  <input name="city" type="text" placeholder="Mumbai" value={fields.city} onChange={handleField} />
                  {errors.city && <span className="error-text">{errors.city}</span>}
                </div>
                <div className={`input-group${errors.state ? ' invalid' : ''}`}>
                  <label>State</label>
                  <input name="state" type="text" placeholder="Maharashtra" value={fields.state} onChange={handleField} />
                  {errors.state && <span className="error-text">{errors.state}</span>}
                </div>
                <div className={`input-group${errors.postal ? ' invalid' : ''}`}>
                  <label>Postal Code</label>
                  <input name="postal" type="text" placeholder="400001" value={fields.postal} onChange={handleField} />
                  {errors.postal && <span className="error-text">{errors.postal}</span>}
                </div>
                <div className={`input-group${errors.phone ? ' invalid' : ''}`}>
                  <label>Phone</label>
                  <input name="phone" type="tel" placeholder="+91 98765 43210" value={fields.phone} onChange={handleField} />
                  {errors.phone && <span className="error-text">{errors.phone}</span>}
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2>Payment Method</h2>
              <div className="payment-options">
                <button
                  type="button"
                  className={`payment-option ${paymentMethod === 'card' ? 'active' : ''}`}
                  onClick={() => { setPaymentMethod('card'); setErrors((prev) => ({ ...prev, paymentMethod: '' })); }}
                >
                  <span className="payment-title">Credit / Debit Card</span>
                  <span className="payment-sub">Visa, MasterCard, Amex</span>
                </button>
                <button
                  type="button"
                  className={`payment-option ${paymentMethod === 'upi' ? 'active' : ''}`}
                  onClick={() => { setPaymentMethod('upi'); setErrors((prev) => ({ ...prev, paymentMethod: '' })); }}
                >
                  <span className="payment-title">UPI</span>
                  <span className="payment-sub">Instant secure transfer</span>
                </button>
                <button
                  type="button"
                  className={`payment-option ${paymentMethod === 'cod' ? 'active' : ''}`}
                  onClick={() => { setPaymentMethod('cod'); setErrors((prev) => ({ ...prev, paymentMethod: '' })); }}
                >
                  <span className="payment-title">Cash on Delivery</span>
                  <span className="payment-sub">Pay when it arrives</span>
                </button>
                {errors.paymentMethod && <span className="error-text">{errors.paymentMethod}</span>}
              </div>

              {paymentMethod === 'card' && (
                <div className="form-grid card-grid">
                  <div className="input-group full">
                    <label>Card Number</label>
                    <input type="text" placeholder="1234 5678 9012 3456" />
                  </div>
                  <div className="input-group">
                    <label>Expiry</label>
                    <input type="text" placeholder="MM/YY" />
                  </div>
                  <div className="input-group">
                    <label>CVV</label>
                    <input type="password" placeholder="123" />
                  </div>
                  <div className="input-group full">
                    <label>Name on Card</label>
                    <input type="text" placeholder="Asha Patel" />
                  </div>
                </div>
              )}

              {paymentMethod === 'upi' && (
                <div className="input-group full">
                  <label>UPI ID</label>
                  <input type="text" placeholder="name@bank" />
                </div>
              )}

              {paymentMethod === 'cod' && (
                <div className="cod-note">
                  Pay by cash or card on delivery. Additional verification may be required.
                </div>
              )}
            </div>

            <div className="form-section">
              <h2>Delivery Notes</h2>
              <textarea
                rows="4"
                placeholder="Add delivery instructions, landmark, or a special note..."
              ></textarea>
            </div>
          </section>

          <aside className="order-summary">
            <h2>Order Summary</h2>
            <div className="summary-items">
              <div className="summary-item">
                <span>The Midnight Garden</span>
                <span>$19.99</span>
              </div>
              <div className="summary-item">
                <span>Atlas of Light</span>
                <span>$16.50</span>
              </div>
            </div>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>$36.49</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="summary-row">
              <span>Taxes</span>
              <span>$2.15</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>$38.64</span>
            </div>
            {errors.cart && <div className="error-text" style={{marginBottom:8}}>{errors.cart}</div>}
            <button className="place-order" type="button" onClick={handlePlaceOrder} disabled={Object.keys(errors).length > 0 || loading}>
              {loading ? (
                <span className="loader-spinner" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 8 }}>
                  <svg width="22" height="22" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="22" cy="22" r="20" stroke="#2e7d32" strokeWidth="4" strokeDasharray="31.4 31.4" strokeLinecap="round">
                      <animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" dur="0.8s" from="0 22 22" to="360 22 22"/>
                    </circle>
                  </svg>
                  Placing order...
                </span>
              ) : 'Place Order'}
            </button>
            {errors.api && <div className="error-text" style={{marginBottom:8}}>{errors.api}</div>}
            <p className="summary-note">By placing your order, you agree to our terms.</p>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
