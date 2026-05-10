const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  creator: { type: String },
  description: { type: String },
  category: { type: String },
  type: { type: String },
  
  // Dual Mode Pricing & Availability
  pricePhysical: { type: Number, default: 0 },
  priceDigital: { type: Number, default: 0 },
  isPhysicalAvailable: { type: Boolean, default: true },
  isDigitalAvailable: { type: Boolean, default: false },
  
  // Digital Asset
  digitalFileUrl: { type: String }, // Secure link to PDF/EPUB
  
  price: { type: Number, required: true }, // Legacy/Default price
  rating: { type: Number, default: 0 },
  totalSales: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvalStatus: { type: String, default: 'pending' },
  status: { type: String, default: 'active' }
});

module.exports = mongoose.model('Product', productSchema);
