const express = require('express');
const authController = require('../controllers/authController');
const wishlistController = require('../controllers/wishlistController');

const router = express.Router();

router.use(authController.protect);

router.get('/getUserWishlistData', wishlistController.getUserWishlistData);
router.post('/importLocalWishlistData', wishlistController.importLocalWishlistData);

router
    .route('/')
    .get(
        authController.restrictTo('admin', 'lead-asist'),
        wishlistController.getAllWishlists,
    )
    .post(wishlistController.createWishlist);

router.route('/:id').delete(wishlistController.deleteWishlist);

module.exports = router;
