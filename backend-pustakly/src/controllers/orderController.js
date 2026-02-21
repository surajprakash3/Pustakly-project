const Order = require('../models/Order');

const placeOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { paymentMethod, paymentDetails, shippingInfo, items, subtotal, tax, total } = req.body;
    if (!['card', 'upi', 'cod'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }
    if (typeof subtotal !== 'number' || typeof tax !== 'number' || typeof total !== 'number') {
      return res.status(400).json({ message: 'Order totals missing' });
    }
    // Status: Placed (default), can be updated to Processing, Shipped, Delivered
    const status = 'Placed';
    const order = new Order({
      user: userId,
      items,
      shippingInfo,
      paymentMethod,
      paymentDetails,
      subtotal,
      tax,
      total,
      status
    });
    await order.save();
    return res.json({ success: true, orderId: order._id });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { placeOrder };
