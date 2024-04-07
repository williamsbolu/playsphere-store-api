const express = require('express');
const authController = require('../controllers/authController');
const productController = require('../controllers/productController');

const router = express.Router();

router
    .route('/hot-deals')
    .get(productController.aliasHotDeals, productController.getAllProducts);
router
    .route('/recently-added')
    .get(productController.aliasRecentProducts, productController.getAllProducts);
router.route('/product/:slug').get(productController.getProductSlug);

router
    .route('/')
    .get(productController.getAllProducts)
    .post(
        authController.protect,
        authController.restrictTo('admin', 'lead-asist'),
        productController.uploadProductImages,
        productController.resizeProductsImages,
        productController.createProduct,
    );

router
    .route('/:id')
    .get(productController.getProduct)
    .patch(
        authController.protect,
        authController.restrictTo('admin', 'lead-asist'),
        productController.uploadProductImages,
        productController.resizeProductsImages,
        productController.deletePreviousProductImages,
        productController.updateCloudfrontImageCache, // invalidates the cache for only the coverImage based on the logic implemented
        productController.updateProduct,
    )
    .delete(
        authController.protect,
        authController.restrictTo('admin', 'lead-asist'),
        productController.deleteProductsImages,
        productController.updateCloudfrontImageCache, // invalidates the cache for both the coverImage and images based on the logic implemented
        productController.deleteProduct,
    );

module.exports = router;
