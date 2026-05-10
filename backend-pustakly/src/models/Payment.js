const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema({
  amount:     { type: Number, required: true },
  reason:     { type: String, default: '' },
  status:     { type: String, enum: ['Pending', 'Processing', 'Refunded', 'Failed'], default: 'Pending' },
  gatewayRefundId: { type: String, default: '' },
  initiatedAt:{ type: Date, default: Date.now },
  completedAt:{ type: Date }
});

const paymentSchema = new mongoose.Schema({
  order:       { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },

  /* Gateway */
  gateway:     { type: String, enum: ['razorpay','stripe','paypal','cod','upi','wallet','card'], required: true },
  gatewayOrderId:   { type: String, default: '' },   // razorpay order id / stripe PI id / paypal order id
  gatewayPaymentId: { type: String, default: '' },   // razorpay payment id / stripe charge id
  gatewaySignature: { type: String, default: '' },   // razorpay webhook signature

  /* Amounts */
  subtotal:    { type: Number, required: true },
  taxAmount:   { type: Number, required: true, default: 0 },
  taxRate:     { type: Number, required: true, default: 18 },    // GST % 
  shippingCost:{ type: Number, required: true, default: 0 },
  discount:    { type: Number, default: 0 },
  total:       { type: Number, required: true },

  /* Currency */
  currency:    { type: String, default: 'INR' },
  exchangeRate:{ type: Number, default: 1 },         // rate vs INR

  /* Status */
  status:      {
    type: String,
    enum: ['Pending', 'Processing', 'Paid', 'Failed', 'Refund Initiated', 'Refunded', 'Cancelled'],
    default: 'Pending'
  },
  paidAt:      { type: Date },
  failureReason: { type: String, default: '' },

  /* Refunds */
  refunds:     [refundSchema],

  /* Invoice */
  invoiceNumber: { type: String, unique: true, sparse: true },
  invoiceUrl:    { type: String, default: '' }

}, { timestamps: true });

/* Auto-generate invoice number on Paid */
paymentSchema.pre('save', async function () {
  if (this.isModified('status') && this.status === 'Paid' && !this.invoiceNumber) {
    const date    = new Date();
    const yymm    = `${String(date.getFullYear()).slice(2)}${String(date.getMonth() + 1).padStart(2,'0')}`;
    const count   = await this.constructor.countDocuments({ invoiceNumber: { $regex: `^INV-${yymm}` } });
    this.invoiceNumber = `INV-${yymm}-${String(count + 1).padStart(4, '0')}`;
    this.paidAt = new Date();
  }
});

module.exports = mongoose.model('Payment', paymentSchema);
