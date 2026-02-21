const getOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch order', error: err.message });
  }
};
const Order = require('../models/Order');
const Cart = require('../models/Cart');

// POST /orders/create
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    // 1. Validate cart
    const cart = await Cart.findOne({ userId });
    if (!cart || !cart.items.length) {
      return res.status(400).json({ message: 'Cart is empty.' });
    }
    // 2. Validate shipping/payment
    const { shippingAddress, paymentMethod } = req.body;
    if (!shippingAddress || !paymentMethod) {
      return res.status(400).json({ message: 'Shipping address and payment method required.' });
    }
    // 3. Calculate totals
    const subtotal = cart.subtotal;
    const tax = Math.round(subtotal * 0.05 * 100) / 100; // 5% tax
    const total = Math.round((subtotal + tax) * 100) / 100;
    // 4. Create order
    const order = await Order.create({
      userId,
      items: cart.items,
      shippingAddress,
      paymentMethod,
      subtotal,
      tax,
      total,
      status: 'Processing'
    });
    // 5. Clear cart
    cart.items = [];
    cart.subtotal = 0;
    await cart.save();
    // 6. Respond with orderId
    res.status(201).json({ orderId: order._id });
  } catch (err) {
    res.status(500).json({ message: 'Order creation failed', error: err.message });
  }
};

// GET /orders/my-orders
const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
  }
};
const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');

const normalizeStatus = (value) => {
  if (!value) return null;
  const key = String(value).toLowerCase();
  const mapping = {
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    completed: 'Delivered',
    cancelled: 'Cancelled',
    canceled: 'Cancelled'
  };
  return mapping[key] || null;
};

const mapOrderRow = (order) => ({
  id: String(order._id),
  orderId: String(order._id),
  buyer: order.buyer || { name: 'Unknown', email: '' },
  seller: order.seller || { name: 'Unknown', email: '' },
  items: Array.isArray(order.items)
    ? order.items.map((item) => ({
        title: item.title || item.name || 'Untitled',
        quantity: Number(item.quantity || 1)
      }))
    : [],
  total: Number(order.total || 0),
  status: normalizeStatus(order.status) || order.status || 'Processing',
  date: order.createdAt
});

const createOrder = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (items.length === 0) {
      return res.status(400).json({ message: 'At least one order item is required' });
    }

    const firstProductId = items[0]?.productId || items[0]?.id;
    if (!firstProductId || !mongoose.Types.ObjectId.isValid(firstProductId)) {
      return res.status(400).json({ message: 'Invalid product id in order items' });
    }

    const product = await Product.findById(firstProductId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const sellerId = product.seller || product.userId;

    const payload = {
      buyer: buyerId,
      seller: sellerId,
      items,
      total: req.body.total || 0,
      status: req.body.status || 'Completed',
      paymentProvider: req.body.paymentProvider || 'stripe',
      paymentId: req.body.paymentId || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const order = await Order.create(payload);

    await Product.findByIdAndUpdate(product._id, {
      $inc: { totalSales: items.reduce((sum, item) => sum + Number(item.quantity || 1), 0) }
    });

    return res.status(201).json({ ...payload, _id: order._id });
  } catch (err) {
    return res.status(500).json({ message: 'Order creation failed', error: err.message });
  }
};

const listOrders = async (req, res) => {
  try {
    const statusFilter = normalizeStatus(req.query.status);
    const matchStage = statusFilter ? { status: statusFilter } : {};
    const orders = await Order.find(matchStage)
      .sort({ createdAt: -1 })
      .populate('buyer', 'name email')
      .populate('seller', 'name email');
    return res.json(orders.map(mapOrderRow));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
  }
};

const listMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.find({ buyer: userId })
      .sort({ createdAt: -1 })
      .populate('seller', 'name email');
    return res.json(orders);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const normalizedStatus = normalizeStatus(req.body?.status);
    if (!normalizedStatus) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: normalizedStatus, updatedAt: new Date() },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    return res.json(mapOrderRow(order));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update order', error: err.message });
  }
};

module.exports = {
  createOrder,
  listOrders,
  listMyOrders,
  updateOrderStatus,
  getOrderById,
  getMyOrders
};
