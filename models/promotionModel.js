const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
    description: String,
    image: {
        type: String,
        required: [true, 'The promotion image must be provided'],
    },
    imageUrl: String,
});

module.exports = mongoose.model('Promotion', promotionSchema);
