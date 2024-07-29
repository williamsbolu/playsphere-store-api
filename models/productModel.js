const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'A product name must be provided'],
        },
        category: {
            type: String,
            enum: [
                'video-game-console',
                'video-games',
                'handheld-game-console',
                'accessories',
                'gift-cards',
            ],
            required: [true, 'A product category must be specified'],
        },
        platform: {
            type: String,
            enum: [
                'ps4',
                'ps5',
                'xbox-one',
                'xbox-series-x',
                'xbox-series-s',
                'nintendo-switch',
                'steam-deck',
                'none',
            ],
            required: [true, 'The product platform must be specified'],
        },
        brand: {
            type: String,
            enum: ['playstation', 'xbox', 'steam', 'nintendo'],
            required: [true, 'The product brand must be provided'],
        },
        genre: {
            type: String,
            enum: [
                'action-games',
                'adventure-games',
                'fighting-games',
                'racing-games',
                'shooter-games',
                'sports-games',
                'horror-games',
            ],
        },
        originalPrice: Number,
        price: {
            type: Number,
            required: [true, 'The product price must be provided'],
        },
        coverImage: {
            type: String,
            required: [true, 'The product cover image link must be provided'],
        },
        images: {
            type: [String],
            required: [true, 'The product images link must be provided'],
        },
        description: [String],
        quantity: {
            type: Number,
            default: 0,
        },
        size: {
            type: String,
            default: 'sm',
            enum: ['sm', 'lg', 'xl'],
        },
        // functionality not implemented yet
        ratings: {
            type: Number,
            default: 3.5,
            min: [1, 'Rating must be above 1.0'],
            max: [5, 'Rating must be below 5.0'],
            set: (val) => Math.round(val * 10) / 10,
        },
        offers: {
            type: String,
            enum: ['hot-deals', 'none'],
            default: 'none',
        },
        salesQuantity: {
            type: Number,
            default: 0,
            select: false,
        },
        // functionality not implemented yet
        youtubeLink: String,
        createdAt: {
            type: Date,
            default: Date.now,
            select: false, // remove later based on project needs
        },
        coverImageUrl: String,
        imagesUrl: [String],
        prevProductSlug: String,
        nextProductSlug: String,
        slug: String,
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

productSchema.virtual('discountedValue').get(function () {
    if (!this.originalPrice) return;

    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
});

productSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
