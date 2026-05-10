const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      title: String,
      price: Number,
      quantity: Number,
      format: { type: String, enum: ['physical', 'digital'], default: 'physical' }
    }
  ],
  subtotal: { type: Number, required: true },
  tax: { type: Number, required: true },
  total: { type: Number, required: true },
  shippingInfo: {
    firstName: String,
    lastName: String,
    address: String,
    city: String,
    state: String,
    postal: String,
    phone: String
  },
  paymentMethod: { type: String, enum: ['card', 'upi', 'cod', 'bank', 'razorpay', 'stripe', 'paypal', 'wallet'], required: true },
  paymentDetails: {
    cardNumber: String,
    expiry: String,
    name: String,
    upi: String
  },
  status: { type: String, enum: ['Placed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Pending', 'Paid', 'COD'], default: 'Placed' },
  
  // Logistics & Tracking
  courierPartner: { type: String, default: 'Self' },
  trackingId: { type: String, default: '' },
  shippingLabelUrl: { type: String, default: '' },
  estimatedDeliveryDate: { type: Date },
  trackingHistory: [{
    status: String,
    location: String,
    timestamp: { type: Date, default: Date.now },
    message: String
  }],
  
  // Delivery Agent Details
  deliveryAgent: {
    name: String,
    phone: String,
    vehicle: String,
    liveDistance: String,
    estimatedArrival: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
