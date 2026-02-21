const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      title: String,
      price: Number,
      quantity: Number
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
  paymentMethod: { type: String, enum: ['card', 'upi', 'cod'], required: true },
  paymentDetails: {
    cardNumber: String,
    expiry: String,
    name: String,
    upi: String
  },
  status: { type: String, enum: ['Placed', 'Processing', 'Shipped', 'Delivered', 'Pending', 'Paid', 'COD'], default: 'Placed' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
