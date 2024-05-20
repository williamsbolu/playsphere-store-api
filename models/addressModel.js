const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'An address must belong to a user'],
    },
    firstName: {
        type: String,
        required: [true, 'The user first name must be provided'],
    },
    lastName: {
        type: String,
        required: [true, 'The user last name must be provided'],
    },
    phone: {
        type: String,
        required: [true, 'The user telephone number must be provided'],
    },
    streetAddress: {
        type: String,
        required: [true, 'The street address must be provided'],
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
    isDefault: {
        type: Boolean,
        default: false,
    },
});

const Address = mongoose.model('Address', addressSchema);
module.exports = Address;
