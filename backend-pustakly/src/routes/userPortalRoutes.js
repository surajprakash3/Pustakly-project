const express = require('express');
const requireAuth = require('../middleware/auth');
const {
  getUserDashboard,
  getUserOrders,
  getUserUploads
} = require('../controllers/userPortalController');

const router = express.Router();

router.get('/dashboard', requireAuth, getUserDashboard);
router.get('/orders', requireAuth, getUserOrders);
router.get('/uploads', requireAuth, getUserUploads);

module.exports = router;
