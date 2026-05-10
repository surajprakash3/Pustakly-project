const express    = require('express');
const router     = express.Router();
const ctrl       = require('../controllers/reviewController');
const requireAuth = require('../middleware/auth');

// Public
router.get('/', ctrl.getReviews);                              // GET /api/reviews?product=&bookId=

// Auth required
router.post('/',              requireAuth, ctrl.createReview);   // POST /api/reviews
router.patch('/:id',          requireAuth, ctrl.updateReview);   // PATCH /api/reviews/:id
router.delete('/:id',         requireAuth, ctrl.deleteReview);   // DELETE /api/reviews/:id
router.post('/:id/helpful',   requireAuth, ctrl.markHelpful);    // POST /api/reviews/:id/helpful
router.post('/:id/reply',     requireAuth, ctrl.sellerReply);    // POST /api/reviews/:id/reply
router.delete('/:id/reply',   requireAuth, ctrl.deleteReply);    // DELETE /api/reviews/:id/reply

module.exports = router;
