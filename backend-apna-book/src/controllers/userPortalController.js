const { ObjectId } = require('mongodb');

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

const getCurrentUser = async (db, userId) =>
  db
    .collection('users')
    .findOne({ _id: userId }, { projection: { password: 0 } });

const getUserDashboard = async (req, res) => {
  const db = req.app.locals.db;
  const userId = new ObjectId(req.user.id);

  const [user, totalOrders, activeUploads, sellerOrders] = await Promise.all([
    getCurrentUser(db, userId),
    db.collection('orders').countDocuments({ buyer: userId }),
    db.collection('products').countDocuments({ seller: userId, approvalStatus: { $ne: 'Sold' } }),
    db
      .collection('orders')
      .find({
        seller: userId,
        status: { $nin: ['Cancelled', 'Refunded', 'Failed'] }
      })
      .project({ total: 1 })
      .toArray()
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
};

const getUserOrders = async (req, res) => {
  const db = req.app.locals.db;
  const userId = new ObjectId(req.user.id);

  const orders = await db
    .collection('orders')
    .find({ buyer: userId })
    .sort({ createdAt: -1 })
    .toArray();

  return res.json({
    items: orders.map(toOrderDto)
  });
};

const getUserUploads = async (req, res) => {
  const db = req.app.locals.db;
  const userId = new ObjectId(req.user.id);

  const uploads = await db
    .collection('products')
    .find({ seller: userId })
    .sort({ createdAt: -1 })
    .toArray();

  return res.json({
    items: uploads.map(toUploadDto)
  });
};

module.exports = {
  getUserDashboard,
  getUserOrders,
  getUserUploads
};
