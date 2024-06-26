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

const productItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: [true, 'The product muust must be specified.'],
    },
    quantity: {
        type: Number,
        required: [true, 'The product quantity must be specified.'],
    },
    // displays the current price at the time the product was ordered
    price: {
        type: Number,
        required: [true, 'The product price must be specified.'],
    },
    originalPrice: Number,
    status: {
        type: String,
        default: 'unconfirmed',
        enum: ['unconfirmed', 'confirmed', 'cancelled', 'out-of-stock', 'refunded'],
    },
});

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    },
    userEmail: {
        type: String,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email'],
    },
    products: {
        type: [productItemSchema],
        required: [true, 'The ordered products must be included.'],
    },
    totalQuantity: {
        type: Number,
        required: [true, 'The total quantity must be specified.'],
    },
    totalAmount: {
        type: Number,
        required: [true, 'The total amount must be specified.'],
    },
    deliveryFees: {
        type: Number,
        required: [true, 'The delivery amount must be specified.'],
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

orderSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'products.product',
        select: 'name coverImage coverImageUrl slug',
    });
    next();
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
