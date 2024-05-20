const mongoose = require('mongoose');
const slugify = require('slugify');

const wishlistSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'A wishlist must have a name'],
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'A wishlist must belong to a user'],
        },
        product: {
            type: mongoose.Schema.ObjectId,
            ref: 'Product',
            required: [true, 'The product/item must be specified'],
        },
        slug: String,
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

wishlistSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

wishlistSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'product',
        select: 'name coverImage originalPrice quantity price', // C:B select the projects important fields
    });
    next();
});

const Wishlist = mongoose.model('Wishlist', wishlistSchema);
module.exports = Wishlist;
