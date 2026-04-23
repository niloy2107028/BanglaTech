const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getRecommendedProducts,
  trackSearchKeywords,
  trackProductView,
  getMyProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

const { protect, authorize } = require('../middleware/auth');

router.get('/', getAllProducts);
router.get('/recommendations', protect, getRecommendedProducts);
router.post('/recommendations/track-search', protect, trackSearchKeywords);
router.get('/mine', protect, authorize('seller', 'admin'), getMyProducts);
router.post('/', protect, authorize('seller'), createProduct);
router.post('/:id/track-view', protect, trackProductView);
router
  .route('/:id')
  .get(getProduct)
  .put(protect, authorize('seller', 'admin'), updateProduct)
  .delete(protect, authorize('seller', 'admin'), deleteProduct);

module.exports = router;
