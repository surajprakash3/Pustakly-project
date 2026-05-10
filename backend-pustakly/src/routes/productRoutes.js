const express = require('express');
const {
  createProduct,
  listProducts,
  listTrendingProducts,
  getProduct,
  updateProduct,
  updateApproval,
  deleteProduct,
  myUploads
} = require('../controllers/productsController');
const requireAuth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { upload } = require('../lib/cloudinary');

const router = express.Router();

router.get('/', listProducts);
router.get('/trending', listTrendingProducts);
router.get('/mine', requireAuth, myUploads);
router.get('/:id', getProduct);
router.post('/', requireAuth, upload.single('digitalFile'), createProduct);
router.patch('/:id', requireAuth, upload.single('digitalFile'), updateProduct);
router.patch('/:id/approval', requireAuth, requireRole('admin'), updateApproval);
router.delete('/:id', requireAuth, deleteProduct);

module.exports = router;
