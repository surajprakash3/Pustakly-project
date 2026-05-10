const express = require('express');
const requireAuth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { listOrders, updateOrderStatus, deleteOrder, getOrderById, updateDeliveryAgent } = require('../controllers/adminOrdersController');

const router = express.Router();

// GET    /api/admin/orders           → list all orders (with optional ?status= filter)
router.get('/', requireAuth, requireRole('admin'), listOrders);

// GET    /api/admin/orders/:id       → get single order detail
router.get('/:id', requireAuth, requireRole('admin'), getOrderById);

// PATCH  /api/admin/orders/:id/status → update order status
router.patch('/:id/status', requireAuth, requireRole('admin'), updateOrderStatus);

// PATCH  /api/admin/orders/:id/agent  → assign delivery agent
router.patch('/:id/agent', requireAuth, requireRole('admin'), updateDeliveryAgent);

// GET /api/admin/orders/settings/payment → Get payment settings
router.get('/settings/payment', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const Settings = require('../models/Settings');
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json(settings.paymentMethodDetails);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH /api/admin/orders/settings/payment → Update payment settings
router.patch('/settings/payment', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const Settings = require('../models/Settings');
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    settings.paymentMethodDetails = { ...settings.paymentMethodDetails, ...req.body };
    await settings.save();
    res.json(settings.paymentMethodDetails);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/admin/orders/:id       → delete order
router.delete('/:id', requireAuth, requireRole('admin'), deleteOrder);

module.exports = router;
