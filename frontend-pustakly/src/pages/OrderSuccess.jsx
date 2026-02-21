
import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import './Checkout.css';

export default function OrderSuccess() {
  const { id } = useParams();
  const { token } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await api.get(`/api/orders/${id}`, { token });
        setOrder(data);
      } catch (err) {
        setError(err.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };
    if (id && token) fetchOrder();
  }, [id, token]);

  return (
    <div className="checkout-page">
      <Navbar />
      <main className="checkout-container">
        <div className="checkout-header">
          <h1>Order Confirmation</h1>
          <p>Thank you for your purchase.</p>
        </div>
        <div className="order-success-box">
          {loading && <p>Loading...</p>}
          {error && <p className="error-text">{error}</p>}
          {order && (
            <>
              <h2>Order Placed Successfully!</h2>
              <p className="order-id">Order ID: <b>{order._id}</b></p>
              <div className="order-section">
                <h3>Items</h3>
                <ul className="order-items-list">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="order-item-row">
                      <span>{item.title}</span>
                      <span>Qty: {item.quantity}</span>
                      <span>₹{item.price}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="order-section">
                <h3>Total Paid</h3>
                <p><b>₹{order.total}</b></p>
              </div>
              <div className="order-section">
                <h3>Delivery Address</h3>
                <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}, {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.state}, {order.shippingAddress.postal}, {order.shippingAddress.phone}</p>
              </div>
              <div className="order-section">
                <h3>Status</h3>
                <p><b>{order.status}</b></p>
              </div>
            </>
          )}
          <Link to="/orders" className="view-orders-link">View My Orders</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
