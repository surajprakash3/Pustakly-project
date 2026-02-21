
import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import OrderTracker from '../components/OrderTracker.jsx';
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

  // Helper for estimated delivery
  function getEstimatedDelivery(status) {
    const days = status === 'Delivered' ? 0 : status === 'Shipped' ? 1 : 3;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center py-10">
        <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center animate-fade-in-up">
          {loading && <p className="text-lg text-gray-500">Loading...</p>}
          {error && <p className="text-red-600 font-semibold">{error}</p>}
          {order && (
            <>
              <div className="flex flex-col items-center mb-4">
                <div className="bg-green-100 rounded-full p-4 mb-2 animate-bounce">
                  <svg className="w-14 h-14 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="white"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2l4-4" /></svg>
                </div>
                <h2 className="text-2xl font-bold text-green-700 mb-1">Order Confirmed Successfully!</h2>
                <p className="text-gray-600">Thank you for shopping with us.</p>
              </div>
              <div className="w-full bg-gray-50 rounded-xl shadow p-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">Order ID:</span>
                  <span className="font-mono">{order._id}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">Total Paid:</span>
                  <span className="text-green-700 font-bold">₹{order.total}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">Estimated Delivery:</span>
                  <span>{getEstimatedDelivery(order.status)}</span>
                </div>
              </div>
              <OrderTracker status={order.status} />
              <div className="flex gap-4 mt-6 w-full">
                <Link to={`/orders/${order._id}`} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg shadow text-center transition-all">Track Order</Link>
                <Link to="/" className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded-lg shadow text-center transition-all">Continue Shopping</Link>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
