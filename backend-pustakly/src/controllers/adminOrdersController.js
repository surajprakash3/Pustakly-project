const Order = require('../models/Order');
const User = require('../models/User');

// Map order to a consistent shape for admin UI
const mapOrder = (order) => ({
  id: String(order._id),
  orderId: String(order._id).slice(-8).toUpperCase(),
  buyer: order.user
    ? { name: order.user.name || order.user.email || 'User', email: order.user.email || '' }
    : { name: 'Unknown', email: '' },
  items: Array.isArray(order.items)
    ? order.items.map((item) => ({ title: item.title || 'Untitled', quantity: Number(item.quantity || 1) }))
    : [],
  total: Number(order.total || 0),
  subtotal: Number(order.subtotal || 0),
  tax: Number(order.tax || 0),
  paymentMethod: order.paymentMethod || 'cod',
  shippingInfo: order.shippingInfo || {},
  status: order.status || 'Placed',
  date: order.createdAt,
  courierPartner: order.courierPartner || 'Self',
  deliveryAgent: order.deliveryAgent || null
});

const VALID_STATUSES = ['Placed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

// GET /api/admin/orders
const listOrders = async (req, res) => {
  try {
    const statusFilter = req.query.status;
    const query = statusFilter ? { status: new RegExp(`^${statusFilter}$`, 'i') } : {};
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(200);
    return res.json(orders.map(mapOrder));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
  }
};

// PATCH /api/admin/orders/:id/status
const updateOrderStatus = async (req, res) => {
  try {
    const status = String(req.body?.status || '').trim();
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    ).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    return res.json(mapOrder(order));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update order status', error: err.message });
  }
};

// DELETE /api/admin/orders/:id
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    return res.json({ success: true, message: 'Order deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete order', error: err.message });
  }
};

// GET /api/admin/orders/:id
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    return res.json(mapOrder(order));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch order', error: err.message });
  }
};

// PATCH /api/admin/orders/:id/agent
const updateDeliveryAgent = async (req, res) => {
  try {
    const { name, phone, vehicle, liveDistance, estimatedArrival } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          deliveryAgent: { name, phone, vehicle, liveDistance, estimatedArrival },
          status: 'Out for Delivery' // Auto transition status
        }
      },
      { new: true }
    ).populate('user', 'name email');
    
    if (!order) return res.status(404).json({ message: 'Order not found' });
    return res.json(mapOrder(order));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to assign delivery agent', error: err.message });
  }
};

module.exports = { listOrders, updateOrderStatus, deleteOrder, getOrderById, updateDeliveryAgent };
