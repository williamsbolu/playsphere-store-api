const mongoose = require('mongoose');
const validator = require('validator');

const deliveryAddressSchema = new mongoose.Schema({
    // added for unauthenticated users
    email: {
        type: String,
    },
    firstName: {
        type: String,
        required: [true, 'The recipient first name must be specified'],
    },
    lastName: {
        type: String,
        required: [true, 'The recipient last name must be specified'],
    },
    phone: {
        type: String,
        required: [true, 'The recipient telephone number must be specified'],
    },
    streetAddress: {
        type: String,
        required: [true, 'The street address must be specified'],
        default: 'lagos',
    },
    directions: String,
    city: {
        type: String,
        required: [true, 'A city must be specified'],
    },
    state: {
        type: String,
        required: [true, 'A state must be specified'],
        default: 'lagos',
    },
});

const orderSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: [true, 'The ordered product must have a name.'],
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    },
    userEmail: {
        type: String,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email'],
    },
    product: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'Product',
            required: [true, 'The ordered product must be specified.'],
        },
    ],
    quantity: {
        type: Number,
        default: 1,
    },
    price: {
        type: Number,
        required: [true, 'The product price must be specified.'],
    },
    // failed orders issues arises automatically, when an order payment fails
    // cancelled can be refunded orders
    status: {
        type: String,
        default: 'unconfirmed',
        enum: ['unconfirmed', 'confirmed', 'cancelled', 'failed', 'delivered'],
    },
    paymentMethod: {
        type: String,
        required: [true, 'The order payment method must be specified.'],
        enum: ['pay-on-delivery', 'pay-with-card', 'direct-bank-transfer'],
    },
    deliveryAddress: {
        type: deliveryAddressSchema,
        required: [true, 'The delivery address must be specified.'],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Custom Pre-Validation Hook
orderSchema.pre('validate', function (next) {
    if (!this.user && !this.userEmail) {
        this.invalidate(
            'user',
            'An order must belong to a user or an email must be provided for unauthenticated users.',
        );
    }
    if (this.userEmail && !validator.isEmail(this.userEmail)) {
        this.invalidate('userEmail', 'Invalid email format.');
    }
    next();
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
