const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'An order must belong to a user.'],
    },
    products: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'Product',
        },
    ],
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
