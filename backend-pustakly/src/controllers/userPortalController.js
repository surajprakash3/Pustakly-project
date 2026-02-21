
const mongoose = require('mongoose');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');

const parseAmount = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const normalized = value.replace(/[^\d.-]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const toOrderDto = (order) => {
  const firstItem = Array.isArray(order.items) && order.items.length > 0 ? order.items[0] : null;
  const title =
    firstItem?.title || firstItem?.name || firstItem?.bookTitle || firstItem?.productName || 'Order Item';

  return {
    id: String(order._id),
    orderNumber: `ORD-${String(order._id).slice(-4).toUpperCase()}`,
    title,
    status: order.status || 'Processing',
    price: parseAmount(order.total),
    createdAt: order.createdAt || null
  };
};

const toUploadDto = (product) => ({
  id: String(product._id),
  uploadNumber: `UP-${String(product._id).slice(-2).toUpperCase()}`,
  title: product.title || product.name || 'Untitled Upload',
  status: product.approvalStatus || product.status || 'Pending',
  price: parseAmount(product.price ?? product.sellingPrice ?? product.amount),
  createdAt: product.createdAt || null
});


const getCurrentUser = async (userId) => {
  return User.findById(userId).select('-password');
};


const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const [user, totalOrders, activeUploads, sellerOrders] = await Promise.all([
      getCurrentUser(userId),
      Order.countDocuments({ userId }),
      Product.countDocuments({ seller: userId, approvalStatus: { $ne: 'Sold' } }),
      Order.find({
        'items': { $elemMatch: { seller: new mongoose.Types.ObjectId(userId) } },
        status: { $nin: ['Cancelled', 'Refunded', 'Failed'] }
      }, { total: 1 })
    ]);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const totalEarnings = sellerOrders.reduce((sum, order) => sum + parseAmount(order.total), 0);

    return res.json({
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role
      },
      stats: {
        totalOrders,
        activeUploads,
        totalEarnings
      }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};


const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 });
    return res.json({
      items: orders.map(toOrderDto)
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};


const getUserUploads = async (req, res) => {
  try {
    const userId = req.user.id;
    const uploads = await Product.find({ seller: userId })
      .sort({ createdAt: -1 });
    return res.json({
      items: uploads.map(toUploadDto)
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  getUserDashboard,
  getUserOrders,
  getUserUploads
};
