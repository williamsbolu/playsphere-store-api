const express = require('express');
const orderController = require('../controllers/OrderController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/initializePayment', orderController.getPaystack);
router.get('/verify/:reference', orderController.verifyPayment);

router.get('/getUserOrders', authController.protect, orderController.getUserOrders);
router
    .route('/')
    .get(
        authController.protect,
        authController.restrictTo('admin', 'lead-asist'),
        orderController.getAllOrders,
    )
    .post(orderController.createOrder);

router.route('/:id').get(orderController.getOrder);

module.exports = router;
