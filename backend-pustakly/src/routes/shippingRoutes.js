const express = require('express');
const { calculateRates, generateLabel, trackOrder, assignPartner, getUserAddresses, addUserAddress, updateAddress, deleteAddress } = require('../controllers/shippingController');
const auth = require('../middleware/auth');
const router = express.Router();

// Shipping Calculation & API Integration
router.post('/rates', calculateRates);
router.post('/label', auth, generateLabel);
router.get('/track/:trackingId', trackOrder);
router.patch('/assign/:orderId', auth, assignPartner);

// Address Management
router.get('/addresses', auth, getUserAddresses);
router.post('/addresses', auth, addUserAddress);
router.patch('/addresses/:addressId', auth, updateAddress);
router.delete('/addresses/:addressId', auth, deleteAddress);

module.exports = router;
