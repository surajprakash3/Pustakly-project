const crypto   = require('crypto');
const Payment  = require('../models/Payment');
const Order    = require('../models/Order');
const User     = require('../models/User');
const Product  = require('../models/Product');

/* ── Order Fulfillment Helper ── */
async function fulfillOrder(orderId) {
  const order = await Order.findById(orderId).populate('user');
  if (!order) return;

  const user = await User.findById(order.user._id);
  if (!user) return;

  let hasPhysical = false;
  let hasDigital = false;

  for (const item of order.items) {
    if (item.format === 'digital') {
      hasDigital = true;
      // Add to digital library if not already present
      const alreadyOwned = user.digitalLibrary.find(d => d.bookId.toString() === item.productId.toString());
      if (!alreadyOwned) {
        user.digitalLibrary.push({
          bookId: item.productId,
          purchaseDate: new Date(),
          format: 'Digital'
        });
      }
    } else {
      hasPhysical = true;
    }
  }

  await user.save();

  // If only digital items, mark as Delivered immediately
  if (hasDigital && !hasPhysical) {
    order.status = 'Delivered';
  } else {
    order.status = 'Processing';
  }
  await order.save();
}

/* ─────────────────────────────────────────
   TAX & CURRENCY HELPERS
───────────────────────────────────────── */
const GST_RATE = 18; // 18% GST
const TAX_CATEGORIES = { book: 5, digital: 18, default: 18 }; // GST slabs

// Approximate exchange rates vs INR (production: call live API)
const EXCHANGE_RATES = {
  INR: 1, USD: 0.012, EUR: 0.011, GBP: 0.0095,
  AED: 0.044, SGD: 0.016, AUD: 0.018, CAD: 0.016
};

function calcTax(subtotal, category = 'default') {
  const rate = TAX_CATEGORIES[category] ?? GST_RATE;
  return { taxRate: rate, taxAmount: Math.round(subtotal * (rate / 100) * 100) / 100 };
}

function convertCurrency(amountInr, targetCurrency = 'INR') {
  const rate = EXCHANGE_RATES[targetCurrency] ?? 1;
  return { convertedAmount: Math.round(amountInr * rate * 100) / 100, exchangeRate: rate };
}

/* ─────────────────────────────────────────
   INVOICE HTML GENERATOR
───────────────────────────────────────── */
function generateInvoiceHtml(payment, order, user) {
  const fmt = (n) => `₹${Number(n).toFixed(2)}`;
  const date = new Date(payment.paidAt || payment.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
  const items = (order.items || []).map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0ece8">${item.title || 'Book'}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0ece8;text-align:center">${item.quantity}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0ece8;text-align:right">${fmt(item.price)}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0ece8;text-align:right">${fmt(item.price * item.quantity)}</td>
    </tr>`).join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${payment.invoiceNumber}</title>
  <style>body{font-family:'Segoe UI',sans-serif;color:#1d1b19;max-width:700px;margin:40px auto;padding:32px;background:#fff}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px}
  .brand{font-size:28px;font-weight:800;color:#b4512d}.inv-no{font-size:13px;color:#7a726b}
  table{width:100%;border-collapse:collapse}.th{background:#fdf4ef;padding:10px;font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:#a88874}
  .total-row{font-weight:700;font-size:16px}.badge{display:inline-block;padding:4px 14px;border-radius:999px;background:#d1fae5;color:#065f46;font-size:12px;font-weight:700}
  </style></head><body>
  <div class="header"><div><div class="brand">📚 Pustakly</div><div class="inv-no">Tax Invoice · GST Compliant</div></div>
  <div style="text-align:right"><div style="font-size:22px;font-weight:800">${payment.invoiceNumber}</div>
  <div class="inv-no">Date: ${date}</div><div class="badge">PAID</div></div></div>
  <div style="display:flex;gap:40px;margin-bottom:32px">
  <div><div style="font-size:11px;text-transform:uppercase;color:#a88874;margin-bottom:6px">Bill To</div>
  <strong>${user?.name || 'Customer'}</strong><br>${user?.email || ''}<br>
  ${order.shippingInfo ? `${order.shippingInfo.address}, ${order.shippingInfo.city}, ${order.shippingInfo.state} - ${order.shippingInfo.postal}` : ''}</div>
  <div><div style="font-size:11px;text-transform:uppercase;color:#a88874;margin-bottom:6px">Payment</div>
  <strong>${payment.gateway?.toUpperCase()}</strong><br>
  ${payment.gatewayPaymentId ? `Ref: ${payment.gatewayPaymentId}` : ''}<br>
  Order: ${order._id}</div></div>
  <table><thead><tr>
  <th class="th" style="text-align:left">Item</th><th class="th" style="text-align:center">Qty</th>
  <th class="th" style="text-align:right">Unit Price</th><th class="th" style="text-align:right">Amount</th>
  </tr></thead><tbody>${items}</tbody></table>
  <div style="margin-top:20px;display:flex;justify-content:flex-end"><div style="min-width:260px">
  <div style="display:flex;justify-content:space-between;padding:6px 0;color:#6f6861"><span>Subtotal</span><span>${fmt(payment.subtotal)}</span></div>
  <div style="display:flex;justify-content:space-between;padding:6px 0;color:#6f6861"><span>Shipping</span><span>${payment.shippingCost === 0 ? 'Free' : fmt(payment.shippingCost)}</span></div>
  <div style="display:flex;justify-content:space-between;padding:6px 0;color:#6f6861"><span>GST (${payment.taxRate}%)</span><span>${fmt(payment.taxAmount)}</span></div>
  ${payment.discount ? `<div style="display:flex;justify-content:space-between;padding:6px 0;color:#059669"><span>Discount</span><span>-${fmt(payment.discount)}</span></div>` : ''}
  <div class="total-row" style="display:flex;justify-content:space-between;padding:12px 0;border-top:2px solid #1d1b19;margin-top:6px"><span>Total</span><span>${fmt(payment.total)}</span></div>
  </div></div>
  <div style="margin-top:40px;padding-top:20px;border-top:1px solid #efe5dc;font-size:12px;color:#9ca3af;text-align:center">
  Pustakly · GSTIN: 27AABCP1234A1Z5 · support@pustakly.com · This is a computer-generated invoice.</div>
  </body></html>`;
}

/* ─────────────────────────────────────────
   RAZORPAY
───────────────────────────────────────── */
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { orderId, currency = 'INR' } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Lazy-load Razorpay only if key is set
    const keyId     = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return res.status(503).json({ message: 'Razorpay not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env' });
    }

    const Razorpay = require('razorpay');
    const rzp      = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const { taxAmount, taxRate } = calcTax(order.subtotal);
    const total = Math.round((order.subtotal + (order.shippingCost || 0) + taxAmount) * 100); // paise

    const rzpOrder = await rzp.orders.create({
      amount: total,
      currency,
      receipt: `rcpt_${orderId}`,
      notes: { orderId: orderId.toString(), userId: req.user.id }
    });

    // Create payment record
    const payment = await Payment.create({
      order: orderId, user: req.user.id,
      gateway: 'razorpay', gatewayOrderId: rzpOrder.id,
      subtotal: order.subtotal, taxAmount, taxRate,
      shippingCost: order.shippingCost || 0,
      total: total / 100, currency, status: 'Pending'
    });

    return res.json({
      razorpayOrderId: rzpOrder.id,
      amount: total,
      currency,
      keyId,
      paymentId: payment._id
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId } = req.body;
    const secret = process.env.RAZORPAY_KEY_SECRET;

    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSig !== razorpaySignature) {
      return res.status(400).json({ message: 'Payment verification failed - invalid signature' });
    }

    const payment = await Payment.findByIdAndUpdate(paymentId,
      { status: 'Paid', gatewayPaymentId: razorpayPaymentId, gatewaySignature: razorpaySignature },
      { new: true }
    );

    await fulfillOrder(payment.order);
    return res.json({ success: true, invoiceNumber: payment.invoiceNumber });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   STRIPE
───────────────────────────────────────── */
exports.createStripeIntent = async (req, res) => {
  try {
    const { orderId, currency = 'inr' } = req.body;
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return res.status(503).json({ message: 'Stripe not configured. Add STRIPE_SECRET_KEY to .env' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const stripe = require('stripe')(secretKey);
    const { taxAmount, taxRate } = calcTax(order.subtotal);
    const totalInr  = order.subtotal + (order.shippingCost || 0) + taxAmount;
    const { convertedAmount, exchangeRate } = convertCurrency(totalInr, currency.toUpperCase());
    const amountCents = Math.round(convertedAmount * 100);

    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: currency.toLowerCase(),
      metadata: { orderId: orderId.toString(), userId: req.user.id }
    });

    const payment = await Payment.create({
      order: orderId, user: req.user.id,
      gateway: 'stripe', gatewayOrderId: intent.id,
      subtotal: order.subtotal, taxAmount, taxRate,
      shippingCost: order.shippingCost || 0,
      total: totalInr, currency: currency.toUpperCase(),
      exchangeRate, status: 'Pending'
    });

    return res.json({
      clientSecret: intent.client_secret,
      paymentId: payment._id,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.confirmStripePayment = async (req, res) => {
  try {
    const { paymentIntentId, paymentId } = req.body;
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const stripe    = require('stripe')(secretKey);

    const intent  = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent.status !== 'succeeded') {
      return res.status(400).json({ message: `Payment not successful: ${intent.status}` });
    }

    const payment = await Payment.findByIdAndUpdate(paymentId,
      { status: 'Paid', gatewayPaymentId: intent.latest_charge },
      { new: true }
    );
    await fulfillOrder(payment.order);
    return res.json({ success: true, invoiceNumber: payment.invoiceNumber });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   PAYPAL
───────────────────────────────────────── */
exports.createPaypalOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const clientId  = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const baseUrl   = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';

    if (!clientId || !clientSecret) {
      return res.status(503).json({ message: 'PayPal not configured. Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to .env' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Get PayPal access token
    const authRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}` },
      body: 'grant_type=client_credentials'
    });
    const { access_token } = await authRes.json();

    const { taxAmount, taxRate } = calcTax(order.subtotal);
    const totalInr = order.subtotal + (order.shippingCost || 0) + taxAmount;
    const { convertedAmount, exchangeRate } = convertCurrency(totalInr, 'USD');

    const ppRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access_token}` },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{ amount: { currency_code: 'USD', value: convertedAmount.toFixed(2) } }]
      })
    });
    const ppOrder = await ppRes.json();

    const payment = await Payment.create({
      order: orderId, user: req.user.id,
      gateway: 'paypal', gatewayOrderId: ppOrder.id,
      subtotal: order.subtotal, taxAmount, taxRate,
      shippingCost: order.shippingCost || 0,
      total: totalInr, currency: 'USD', exchangeRate, status: 'Pending'
    });

    return res.json({ paypalOrderId: ppOrder.id, paymentId: payment._id });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.capturePaypalOrder = async (req, res) => {
  try {
    const { paypalOrderId, paymentId } = req.body;
    const clientId     = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const baseUrl      = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';

    const authRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}` },
      body: 'grant_type=client_credentials'
    });
    const { access_token } = await authRes.json();

    const captureRes = await fetch(`${baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access_token}` }
    });
    const capture = await captureRes.json();

    if (capture.status !== 'COMPLETED') {
      return res.status(400).json({ message: `PayPal capture failed: ${capture.status}` });
    }

    const payment = await Payment.findByIdAndUpdate(paymentId,
      { status: 'Paid', gatewayPaymentId: capture.id },
      { new: true }
    );
    await fulfillOrder(payment.order);
    return res.json({ success: true, invoiceNumber: payment.invoiceNumber });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   COD / WALLET / UPI (simulation)
───────────────────────────────────────── */
exports.processCOD = async (req, res) => {
  try {
    const { orderId, gateway = 'cod' } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const { taxAmount, taxRate } = calcTax(order.subtotal);
    const total = Math.round((order.subtotal + (order.shippingCost || 0) + taxAmount) * 100) / 100;

    const payment = await Payment.create({
      order: orderId, user: req.user.id,
      gateway, subtotal: order.subtotal, taxAmount, taxRate,
      shippingCost: order.shippingCost || 0,
      total, currency: 'INR',
      status: gateway === 'cod' ? 'Pending' : 'Paid'
    });

    // Mark order as placed/processing
    await Order.findByIdAndUpdate(orderId, { status: gateway === 'cod' ? 'Placed' : 'Processing' });
    return res.json({ success: true, paymentId: payment._id, invoiceNumber: payment.invoiceNumber });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   REFUND
───────────────────────────────────────── */
exports.initiateRefund = async (req, res) => {
  try {
    const { paymentId, amount, reason } = req.body;
    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.status !== 'Paid') return res.status(400).json({ message: 'Only paid payments can be refunded' });

    const refundAmount = amount || payment.total;

    // Razorpay refund
    if (payment.gateway === 'razorpay' && payment.gatewayPaymentId) {
      const Razorpay = require('razorpay');
      const rzp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
      const refund = await rzp.payments.refund(payment.gatewayPaymentId, { amount: Math.round(refundAmount * 100) });
      payment.refunds.push({ amount: refundAmount, reason, status: 'Processing', gatewayRefundId: refund.id });
    } else {
      // Stripe / COD / others
      payment.refunds.push({ amount: refundAmount, reason, status: 'Pending' });
    }

    payment.status = 'Refund Initiated';
    await payment.save();
    await Order.findByIdAndUpdate(payment.order, { status: 'Cancelled' });

    return res.json({ message: 'Refund initiated', refunds: payment.refunds });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   INVOICE
───────────────────────────────────────── */
exports.getInvoice = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId).populate('order').populate('user', 'name email');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    // Only allow owner or admin
    if (String(payment.user._id || payment.user) !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const html = generateInvoiceHtml(payment, payment.order, payment.user);
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${payment.invoiceNumber || 'invoice'}.html"`);
    return res.send(html);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   PAYMENT STATUS + HISTORY
───────────────────────────────────────── */
exports.getPaymentStatus = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId).populate('order', 'status items');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (String(payment.user) !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return res.json(payment);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .populate('order', 'status items')
      .sort({ createdAt: -1 });
    return res.json(payments);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   CURRENCY CONVERTER (public)
───────────────────────────────────────── */
exports.getCurrencies = async (req, res) => {
  return res.json({
    base: 'INR',
    rates: EXCHANGE_RATES,
    supported: Object.keys(EXCHANGE_RATES)
  });
};

exports.convertAmount = async (req, res) => {
  const { amount, from = 'INR', to = 'INR' } = req.query;
  const inrAmount = Number(amount) / (EXCHANGE_RATES[from] || 1);
  const { convertedAmount, exchangeRate } = convertCurrency(inrAmount, to);
  return res.json({ from, to, amount: Number(amount), convertedAmount, exchangeRate });
};

const Settings = require('../models/Settings');
exports.getPaymentSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    return res.json(settings.paymentMethodDetails);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
