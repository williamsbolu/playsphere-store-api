const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: [true, 'The ordered product must have a name.'],
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'An order must belong to a user.'],
    },
    product: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'Product',
            required: [true, 'The ordered product must be specified.'],
        },
    ],
    status: {
        type: String,
        default: 'unconfirmed',
        enum: ['unconfirmed', 'confirmed', 'cancelled', 'delivered'],
    },
    paymentMethod: {
        type: String,
        required: [true, 'The order payment method must be specified.'],
        enum: ['pay-on-delivery', 'pay-with-card', 'direct-bank-transfer'],
    },
    // deliveryAddress: {

    // },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
