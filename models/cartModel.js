const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'A cart must belong to a user'],
        },
        product: {
            type: mongoose.Schema.ObjectId,
            ref: 'Product',
            required: [true, 'A cart must belong to an item/product'],
        },
        price: {
            type: Number,
            required: [true, 'A cart must have a price'],
        },
        quantity: {
            type: Number,
            default: 1,
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

cartSchema.virtual('itemPriceTotal').get(function () {
    return this.price * this.quantity;
});

cartSchema.pre(/^find/, function (next) {
    this.itemPriceTotal = this.price * this.quantity;

    this.populate({
        path: 'product',
        select: 'name coverImage originalPrice quantity slug', // C:B select the projects important fields
    });
    next();
});

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
