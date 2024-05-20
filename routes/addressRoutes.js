const express = require('express');
const authController = require('../controllers/authController');
const addressController = require('../controllers/addressController');

const router = express.Router();

router.use(authController.protect);
router.get('/getUserAddress', addressController.getUserAddresses);

router.route('/').post(addressController.createAddress);
router
    .route('/:id')
    .patch(addressController.updateAddress)
    .delete(addressController.deleteAddress);

module.exports = router;
