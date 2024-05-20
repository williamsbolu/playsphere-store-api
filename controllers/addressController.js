const Address = require('../models/addressModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.deleteAddress = factory.deleteOne(Address);

exports.createAddress = catchAsync(async (req, res, next) => {
    // Checks if the user already has a default address
    const existingDefaultAddress = await Address.findOne({
        user: req.user.id,
        isDefault: true,
    });

    req.body.user = req.user.id;
    if (!existingDefaultAddress || req.body.isDefault) {
        req.body.isDefault = true;
    }
    const doc = await Address.create(req.body);

    // Update the previous default address if it exists
    if (existingDefaultAddress && req.body.isDefault) {
        existingDefaultAddress.isDefault = false;
        await existingDefaultAddress.save();
    }

    res.status(201).json({
        status: 'success',
        data: doc,
    });
});

exports.updateAddress = catchAsync(async (req, res, next) => {
    const address = req.body;

    // if the user is updating the address default state, we remove the prev default address
    if (address.isDefault) {
        const prevDefaultAddress = await Address.findOne({
            user: req.user.id,
            isDefault: true,
            _id: { $ne: req.params.id },
        });

        if (prevDefaultAddress) {
            prevDefaultAddress.isDefault = false;
            await prevDefaultAddress.save();
        }
    }

    const doc = await Address.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    res.status(201).json({
        status: 'success',
        data: doc,
    });
});

exports.getUserAddresses = catchAsync(async (req, res, next) => {
    const addresses = await Address.find({ user: req.user.id });

    // send response
    res.status(200).json({
        status: 'success',
        results: addresses.length,
        data: addresses,
    });
});
