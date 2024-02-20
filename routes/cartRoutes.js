const express = require('express');
const authController = require('../controllers/authController');
const cartController = require('../controllers/cartController');

const router = express.Router();

router.use(authController.protect);

router.get('/getUserCartData', cartController.getUserCartData);
router.post('/importLocalCartData', cartController.importUserLocalCartData);

router
    .route('/')
    .get(authController.restrictTo('admin', 'lead-asist'), cartController.getAllCarts)
    .post(cartController.createCart);

router
    .route('/:id')
    .get(cartController.getCart)
    .patch(cartController.filterCartRequestBody, cartController.updateCartItem)
    .delete(cartController.deleteCart);

module.exports = router;
