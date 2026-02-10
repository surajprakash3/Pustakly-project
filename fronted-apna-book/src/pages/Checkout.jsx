import { useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import './Checkout.css';

export default function Checkout() {
  const [paymentMethod, setPaymentMethod] = useState('card');

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
                <div className="input-group">
                  <label>First Name</label>
                  <input type="text" placeholder="Asha" />
                </div>
                <div className="input-group">
                  <label>Last Name</label>
                  <input type="text" placeholder="Patel" />
                </div>
                <div className="input-group full">
                  <label>Street Address</label>
                  <input type="text" placeholder="221B Linden Lane" />
                </div>
                <div className="input-group">
                  <label>City</label>
                  <input type="text" placeholder="Mumbai" />
                </div>
                <div className="input-group">
                  <label>State</label>
                  <input type="text" placeholder="Maharashtra" />
                </div>
                <div className="input-group">
                  <label>Postal Code</label>
                  <input type="text" placeholder="400001" />
                </div>
                <div className="input-group">
                  <label>Phone</label>
                  <input type="tel" placeholder="+91 98765 43210" />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2>Payment Method</h2>
              <div className="payment-options">
                <button
                  type="button"
                  className={`payment-option ${paymentMethod === 'card' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('card')}
                >
                  <span className="payment-title">Credit / Debit Card</span>
                  <span className="payment-sub">Visa, MasterCard, Amex</span>
                </button>
                <button
                  type="button"
                  className={`payment-option ${paymentMethod === 'upi' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('upi')}
                >
                  <span className="payment-title">UPI</span>
                  <span className="payment-sub">Instant secure transfer</span>
                </button>
                <button
                  type="button"
                  className={`payment-option ${paymentMethod === 'cod' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('cod')}
                >
                  <span className="payment-title">Cash on Delivery</span>
                  <span className="payment-sub">Pay when it arrives</span>
                </button>
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
            <button className="place-order" type="button">
              Place Order
            </button>
            <p className="summary-note">By placing your order, you agree to our terms.</p>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
