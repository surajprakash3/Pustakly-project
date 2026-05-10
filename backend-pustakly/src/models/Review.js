const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  text:      { type: String, required: true, trim: true, maxlength: 1000 },
  repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

const reviewSchema = new mongoose.Schema({
  // Can reference either a Product (marketplace) or a book by numeric id
  product:         { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  bookId:          { type: Number, default: null },           // for static-data books

  user:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating:          { type: Number, required: true, min: 1, max: 5 },
  title:           { type: String, trim: true, maxlength: 120, default: '' },
  comment:         { type: String, required: true, trim: true, maxlength: 2000 },
  verifiedPurchase:{ type: Boolean, default: false },
  helpful:         { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] }, // users who marked helpful
  sellerReply:     { type: replySchema, default: null }
}, { timestamps: true });

// One review per user per product/book
reviewSchema.index({ product: 1, user: 1 }, { unique: true, sparse: true });
reviewSchema.index({ bookId: 1, user: 1  }, { unique: true, sparse: true });

module.exports = mongoose.model('Review', reviewSchema);
