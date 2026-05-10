const Review  = require('../models/Review');
const Order   = require('../models/Order');

/* ─── helpers ─── */
const fmt = (r, userId) => ({
  id:               r._id,
  user:             { id: r.user?._id, name: r.user?.name || 'Anonymous' },
  rating:           r.rating,
  title:            r.title,
  comment:          r.comment,
  verifiedPurchase: r.verifiedPurchase,
  helpfulCount:     r.helpful?.length || 0,
  markedHelpful:    userId ? r.helpful?.some(id => String(id) === String(userId)) : false,
  sellerReply:      r.sellerReply || null,
  createdAt:        r.createdAt
});

/* ─── GET /api/reviews?product=&bookId= ─── */
exports.getReviews = async (req, res) => {
  try {
    const { product, bookId } = req.query;
    const filter = product ? { product } : { bookId: Number(bookId) };
    const reviews = await Review.find(filter)
      .populate('user', 'name')
      .populate('sellerReply.repliedBy', 'name')
      .sort({ createdAt: -1 });

    // Build summary stats
    const total  = reviews.length;
    const avg    = total ? (reviews.reduce((s, r) => s + r.rating, 0) / total) : 0;
    const dist   = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => { dist[r.rating] = (dist[r.rating] || 0) + 1; });

    const userId = req.user?.id;
    return res.json({
      stats: { total, avg: Math.round(avg * 10) / 10, distribution: dist },
      reviews: reviews.map(r => fmt(r, userId))
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* ─── POST /api/reviews ─── */
exports.createReview = async (req, res) => {
  try {
    const { productId, bookId, rating, title, comment } = req.body;
    const userId = req.user.id;

    if (!rating || !comment) return res.status(400).json({ message: 'Rating and comment are required' });
    if (rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be 1–5' });

    // Check verified purchase
    let verifiedPurchase = false;
    if (productId) {
      const purchasedOrder = await Order.findOne({
        user: userId,
        'items.productId': productId,
        status: 'Delivered'
      });
      verifiedPurchase = !!purchasedOrder;
    }

    // Check duplicate
    const existing = await Review.findOne(
      productId ? { product: productId, user: userId } : { bookId: Number(bookId), user: userId }
    );
    if (existing) return res.status(409).json({ message: 'You have already reviewed this item' });

    const review = await Review.create({
      product:          productId || null,
      bookId:           bookId    ? Number(bookId) : null,
      user:             userId,
      rating:           Number(rating),
      title:            title?.trim() || '',
      comment:          comment.trim(),
      verifiedPurchase
    });

    await review.populate('user', 'name');
    return res.status(201).json(fmt(review, userId));
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'You have already reviewed this item' });
    return res.status(500).json({ message: err.message });
  }
};

/* ─── PATCH /api/reviews/:id ─── */
exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, user: req.user.id });
    if (!review) return res.status(404).json({ message: 'Review not found or not yours' });

    const { rating, title, comment } = req.body;
    if (rating) review.rating = Number(rating);
    if (title  !== undefined) review.title   = title.trim();
    if (comment) review.comment = comment.trim();
    await review.save();
    await review.populate('user', 'name');
    return res.json(fmt(review, req.user.id));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* ─── DELETE /api/reviews/:id ─── */
exports.deleteReview = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const filter  = isAdmin ? { _id: req.params.id } : { _id: req.params.id, user: req.user.id };
    const review  = await Review.findOneAndDelete(filter);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    return res.json({ message: 'Deleted' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* ─── POST /api/reviews/:id/helpful ─── */
exports.markHelpful = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    const uid    = req.user.id;
    const idx    = review.helpful.findIndex(id => String(id) === String(uid));
    if (idx === -1) review.helpful.push(uid);
    else review.helpful.splice(idx, 1);
    await review.save();
    return res.json({ helpfulCount: review.helpful.length, markedHelpful: idx === -1 });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* ─── POST /api/reviews/:id/reply  (seller or admin only) ─── */
exports.sellerReply = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Reply text is required' });

    const review = await Review.findById(req.params.id).populate('product');
    if (!review) return res.status(404).json({ message: 'Review not found' });

    // Only admin or the seller of the product can reply
    const isAdmin  = req.user.role === 'admin';
    const isSeller = review.product && String(review.product.seller) === String(req.user.id);
    if (!isAdmin && !isSeller) return res.status(403).json({ message: 'Only the seller or admin can reply' });

    review.sellerReply = { text: text.trim(), repliedBy: req.user.id };
    await review.save();
    await review.populate('sellerReply.repliedBy', 'name');
    return res.json({ sellerReply: review.sellerReply });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* ─── DELETE /api/reviews/:id/reply  (seller or admin) ─── */
exports.deleteReply = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id).populate('product');
    if (!review) return res.status(404).json({ message: 'Review not found' });

    const isAdmin  = req.user.role === 'admin';
    const isSeller = review.product && String(review.product.seller) === String(req.user.id);
    if (!isAdmin && !isSeller) return res.status(403).json({ message: 'Forbidden' });

    review.sellerReply = null;
    await review.save();
    return res.json({ message: 'Reply removed' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
