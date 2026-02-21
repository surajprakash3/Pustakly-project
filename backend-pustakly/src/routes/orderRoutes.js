
const express = require('express');
const { createOrder, getMyOrders, getOrderById } = require('../controllers/ordersController');
const { placeOrder } = require('../controllers/orderController');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const router = express.Router();

// POST /orders/create
router.post('/create', auth, createOrder);

// POST /api/orders (production-ready checkout)
router.post('/', auth, placeOrder);

// GET /orders/my-orders
router.get('/my-orders', auth, getMyOrders);

// GET /orders/:id (user's own order)
router.get('/:id', auth, getOrderById);

module.exports = router;
