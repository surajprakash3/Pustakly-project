const express      = require('express');
const router       = express.Router();
const ctrl         = require('../controllers/paymentController');
const requireAuth  = require('../middleware/auth');

/* ── Public ── */
router.get('/currencies',          ctrl.getCurrencies);       // GET  /api/payment/currencies
router.get('/convert',             ctrl.convertAmount);        // GET  /api/payment/convert?amount=&from=&to=
router.get('/settings',            ctrl.getPaymentSettings);   // GET  /api/payment/settings

/* ── Auth required ── */
router.get('/my',                  requireAuth, ctrl.getMyPayments);                         // GET  /api/payment/my
router.get('/status/:paymentId',   requireAuth, ctrl.getPaymentStatus);                      // GET  /api/payment/status/:id
router.get('/invoice/:paymentId',  requireAuth, ctrl.getInvoice);                            // GET  /api/payment/invoice/:id (downloads HTML)

/* ── Razorpay ── */
router.post('/razorpay/create',    requireAuth, ctrl.createRazorpayOrder);                   // POST /api/payment/razorpay/create
router.post('/razorpay/verify',    requireAuth, ctrl.verifyRazorpayPayment);                 // POST /api/payment/razorpay/verify

/* ── Stripe ── */
router.post('/stripe/intent',      requireAuth, ctrl.createStripeIntent);                    // POST /api/payment/stripe/intent
router.post('/stripe/confirm',     requireAuth, ctrl.confirmStripePayment);                  // POST /api/payment/stripe/confirm

/* ── PayPal ── */
router.post('/paypal/create',      requireAuth, ctrl.createPaypalOrder);                     // POST /api/payment/paypal/create
router.post('/paypal/capture',     requireAuth, ctrl.capturePaypalOrder);                    // POST /api/payment/paypal/capture

/* ── COD / UPI / Wallet ── */
router.post('/cod',                requireAuth, ctrl.processCOD);                            // POST /api/payment/cod

/* ── Refund ── */
router.post('/refund',             requireAuth, ctrl.initiateRefund);                        // POST /api/payment/refund

module.exports = router;
