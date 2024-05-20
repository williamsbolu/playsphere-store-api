const express = require('express');
const orderController = require('../controllers/OrderController');

const router = express.Router();

router.get('/paystack', orderController.getPaystack);

module.exports = router;
