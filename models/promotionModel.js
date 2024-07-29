const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
    description: String,
    image: {
        type: String,
        required: [true, 'The promotion image must be provided'],
    },
    imageUrl: String,
});

const Promotion = mongoose.model('Promotion', promotionSchema);
module.exports = Promotion;
