const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  creator: { type: String },
  description: { type: String },
  category: { type: String },
  type: { type: String },
  price: { type: Number, required: true },
  rating: { type: Number, default: 0 },
  totalSales: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvalStatus: { type: String },
  status: { type: String }
});

module.exports = mongoose.model('Product', productSchema);
