const express = require('express');
const authController = require('../controllers/authController');
const promotionController = require('../controllers/promotionController');

const router = express.Router();

router
    .route('/')
    .get(promotionController.getAllPromotions)
    .post(
        authController.protect,
        authController.restrictTo('admin', 'lead-asist'),
        promotionController.uploadPromotionImage,
        promotionController.resizePromotionPhoto,
        promotionController.createPromotion,
    );

router
    .route('/:id')
    .patch(
        authController.protect,
        authController.restrictTo('admin', 'lead-asist'),
        promotionController.uploadPromotionImage,
        promotionController.resizePromotionPhoto,
        promotionController.updatePromotion,
    )
    .delete(
        authController.protect,
        authController.restrictTo('admin', 'lead-asist'),
        promotionController.deletePromotionImage,
        promotionController.deletePromotion,
    );

module.exports = router;
