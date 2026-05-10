const Order = require('../models/Order');

const placeOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { paymentMethod, paymentDetails, shippingInfo, items, subtotal, tax, shippingCost, total, courierPartner } = req.body;
    if (!['card', 'upi', 'cod', 'bank', 'razorpay', 'stripe', 'paypal', 'wallet'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }
    if (typeof subtotal !== 'number' || typeof tax !== 'number' || typeof total !== 'number') {
      return res.status(400).json({ message: 'Order totals missing' });
    }
    const order = new Order({
      user: userId,
      items,
      shippingInfo,
      paymentMethod,
      paymentDetails,
      subtotal,
      tax,
      total,
      shippingCost: shippingCost || 0,
      courierPartner: courierPartner || 'Self',
      status: 'Placed'
    });
    await order.save();
    // Clear user cart after successful order
    const Cart = require('../models/Cart');
    await Cart.findOneAndUpdate(
      { userId },
      { $set: { items: [], subtotal: 0 } }
    );
    return res.json({ success: true, orderId: order._id });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// PATCH /api/orders/:id/cancel
const cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const order = await Order.findOne({ _id: req.params.id, user: userId });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const daysSince = Math.floor((Date.now() - new Date(order.createdAt)) / 86400000);
    if (daysSince > 2) {
      return res.status(400).json({ message: 'Cancellation window of 2 days has passed.' });
    }
    if (['Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].includes(order.status)) {
      return res.status(400).json({ message: `Cannot cancel an order that is already ${order.status}.` });
    }

    order.status = 'Cancelled';
    await order.save();
    return res.json({ success: true, message: 'Order cancelled successfully.', order });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// PATCH /api/orders/:id/address
const updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const order = await Order.findOne({ _id: req.params.id, user: userId });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const daysSince = Math.floor((Date.now() - new Date(order.createdAt)) / 86400000);
    if (daysSince > 2) {
      return res.status(400).json({ message: 'Address change window of 2 days has passed.' });
    }
    if (['Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].includes(order.status)) {
      return res.status(400).json({ message: `Cannot change address for an order that is ${order.status}.` });
    }

    const { firstName, lastName, address, city, state, postal, phone } = req.body;
    if (!address || !city || !state || !postal) {
      return res.status(400).json({ message: 'Address, city, state and postal code are required.' });
    }

    order.shippingInfo = { firstName, lastName, address, city, state, postal, phone };
    await order.save();
    return res.json({ success: true, message: 'Shipping address updated successfully.', order });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// POST /api/orders/:id/exchange
const requestExchange = async (req, res) => {
  try {
    const userId = req.user.id;
    const order = await Order.findOne({ _id: req.params.id, user: userId });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== 'Delivered') {
      return res.status(400).json({ message: 'Exchange can only be requested for delivered orders.' });
    }
    const daysSinceDelivery = Math.floor((Date.now() - new Date(order.updatedAt)) / 86400000);
    if (daysSinceDelivery > 7) {
      return res.status(400).json({ message: 'Exchange/return window of 7 days has passed.' });
    }
    // In a real system, you'd create an exchange request record.
    // For now, we log the reason and return success.
    const { reason } = req.body;
    return res.json({
      success: true,
      message: 'Exchange request submitted. Our team will contact you within 24 hours.',
      orderId: order._id,
      reason: reason || 'Not specified'
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { placeOrder, cancelOrder, updateAddress, requestExchange };
