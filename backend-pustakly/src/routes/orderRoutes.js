const express = require('express');
const { createOrder, getMyOrders, getOrderById } = require('../controllers/ordersController');
const { placeOrder, cancelOrder, updateAddress, requestExchange } = require('../controllers/orderController');
const auth = require('../middleware/auth');
const router = express.Router();

// POST   /api/orders              → place a new order
router.post('/', auth, placeOrder);

// POST   /api/orders/create       → legacy create
router.post('/create', auth, createOrder);

// GET    /api/orders/my-orders    → list current user's orders
router.get('/my-orders', auth, getMyOrders);

// GET    /api/orders/:id          → get single order (current user)
router.get('/:id', auth, getOrderById);

// PATCH  /api/orders/:id/cancel   → cancel order (within 2 days)
router.patch('/:id/cancel', auth, cancelOrder);

// PATCH  /api/orders/:id/address  → change shipping address (within 2 days)
router.patch('/:id/address', auth, updateAddress);

// POST   /api/orders/:id/exchange → request exchange/return (within 7 days of delivery)
router.post('/:id/exchange', auth, requestExchange);

module.exports = router;
