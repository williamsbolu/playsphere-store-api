const multer = require('multer');
const sharp = require('sharp');
const uniqid = require('uniqid');
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { CreateInvalidationCommand } = require('@aws-sdk/client-cloudfront');
const Promotion = require('../models/promotionModel');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const cloudFront = require('../utils/cloudFront');
const s3 = require('../utils/s3');

const multerStorage = multer.memoryStorage();

// Test if d uploaded file is an image. To allow only images to be uploaded (true or false)
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an image! Please upload only images', 400), false);
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});

exports.uploadPromotionImage = upload.single('image');

exports.resizePromotionPhoto = catchAsync(async (req, res, next) => {
    if (!req?.file) return next();

    if (req.params.id) {
        const doc = await Promotion.findById(req.params.id);
        req.body.image = doc.image;
    } else {
        req.body.image = uniqid(`promotion-`, `${Date.now().toString()}.jpg`);
    }

    const buffer = await sharp(req.file.buffer)
        .resize(1200, 400, {
            fit: 'contain',
        })
        .toFormat('jpg')
        .jpeg({ quality: 90 })
        .toBuffer();

    const command = new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: `users/${req.body.image}`,
        Body: buffer,
        ContentType: 'image/jpeg',
    });

    await s3.send(command);

    if (req.params.id) {
        // invalidate the cloud front cache for the updated image
        const callerReferenceValue = `${req.body.image}-${Date.now()}`;

        const invalidationParams = {
            DistributionId: process.env.USERS_DISTRIBUTION_ID,
            InvalidationBatch: {
                CallerReference: callerReferenceValue,
                Paths: {
                    Quantity: 1,
                    Items: ['/' + req.body.image],
                },
            },
        };
        const invalidationCommand = new CreateInvalidationCommand(invalidationParams);
        await cloudFront.send(invalidationCommand);
    }

    next();
});

exports.getAllPromotions = catchAsync(async (req, res, next) => {
    const doc = await Promotion.find();

    if (doc.length > 0) {
        for (const curDoc of doc) {
            curDoc['imageUrl'] = process.env.USERS_CLOUD_FRONT_URL + curDoc['image'];
        }
    }

    // SEND RESPONSE
    res.status(200).json({
        status: 'success',
        results: doc.length,
        data: doc,
    });
});

exports.deletePromotionImage = catchAsync(async (req, res, next) => {
    const doc = await Promotion.findById(req.params.id);

    if (!doc) {
        return next(new AppError('No document found with that ID', 404));
    }

    const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: `users/${doc.image}`,
    };

    const command = new DeleteObjectCommand(params);
    await s3.send(command);

    next();
});

exports.updatePromotion = factory.updateOne(Promotion);
exports.createPromotion = factory.createOne(Promotion);
exports.deletePromotion = factory.deleteOne(Promotion);
