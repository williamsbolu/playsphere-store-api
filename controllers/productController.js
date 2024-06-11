const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { CreateInvalidationCommand } = require('@aws-sdk/client-cloudfront');
const sharp = require('sharp');
const multer = require('multer');
const slugify = require('slugify');
const uniqid = require('uniqid');
const Product = require('../models/productModel');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const s3 = require('../utils/s3');
const cloudFront = require('../utils/cloudFront');

const multerStorage = multer.memoryStorage();

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

exports.uploadProductImages = upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'images', maxCount: 6 },
]);

exports.resizeProductsImages = catchAsync(async (req, res, next) => {
    if (!req?.files?.coverImage && !req?.files?.images) return next();

    let preciousProductName;
    let coverImageValue;
    if (req.params.id) {
        const doc = await Product.findById(req.params.id);
        coverImageValue = doc.coverImage;
        preciousProductName = doc.name;
    }

    // if we're creating or updating the cover image
    if (req.files?.coverImage) {
        if (req.params.id) {
            req.body.coverImage = coverImageValue;

            // To update the cache of the image in d next middeleware, so the users gets the updated images immedialely
            req.coverImageinvalidationKey = req.body.coverImage;
        } else {
            req.body.coverImage = uniqid(
                `${slugify(req.body.name, { lower: true })}-`,
                `-${Date.now().toString()}.png`,
            );
        }

        // 1) Cover image
        const metaData = await sharp(req.files.coverImage[0].buffer).metadata();
        let buffer;
        if (metaData.width > 900) {
            buffer = await sharp(req.files.coverImage[0].buffer)
                .resize({ width: 900 })
                .toFormat('png')
                .png({ quality: 90 })
                .toBuffer();
        } else {
            buffer = await sharp(req.files.coverImage[0].buffer)
                .toFormat('png')
                .png({ quality: 90 })
                .toBuffer();
        }

        const command = new PutObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: `products/${req.body.coverImage}`,
            Body: buffer,
            ContentType: 'image/png',
        });
        await s3.send(command);
    }

    // if we're creating or updating the other images
    if (req.files?.images) {
        // (2) Other Images
        req.body.images = [];

        await Promise.all(
            req.files.images.map(async (file, i) => {
                const fileName = req.params.id
                    ? uniqid(
                          `${slugify(preciousProductName, { lower: true })}-slides-${i + 1}-`,
                          `-${Date.now().toString()}.png`,
                      )
                    : uniqid(
                          `${slugify(req.body.name, { lower: true })}-slides-${i + 1}-`,
                          `-${Date.now().toString()}.png`,
                      );

                const curMetaData = await sharp(file.buffer).metadata();
                let curBuffer;
                if (curMetaData.width > 900) {
                    curBuffer = await sharp(file.buffer)
                        .resize({ width: 900 })
                        .toFormat('png')
                        .png({ quality: 90 })
                        .toBuffer();
                } else {
                    curBuffer = await sharp(file.buffer)
                        .toFormat('png')
                        .png({ quality: 90 })
                        .toBuffer();
                }

                const curCommand = new PutObjectCommand({
                    Bucket: process.env.BUCKET_NAME,
                    Key: `products/${fileName}`,
                    Body: curBuffer,
                    ContentType: 'image/png',
                });
                await s3.send(curCommand);
                req.body.images.push(fileName);
            }),
        );
    }

    next();
});

exports.deletePreviousProductImages = catchAsync(async (req, res, next) => {
    if (!req?.files?.images) return next();

    const doc = await Product.findById(req.params.id);

    try {
        // if we are updating d images array and if there are previous images in the bucket
        if (req.files.images && doc.images.length > 0) {
            await Promise.all(
                doc.images.map(async (image) => {
                    const command = new DeleteObjectCommand({
                        Bucket: process.env.BUCKET_NAME,
                        Key: `products/${image}`,
                    });
                    await s3.send(command);
                }),
            );

            // delete from cloudFront cache
            await Promise.all(
                doc.images.map(async (key) => {
                    const invalidationParams = {
                        DistributionId: process.env.PRODUCTS_DISTRIBUTION_ID,
                        InvalidationBatch: {
                            CallerReference: key,
                            Paths: {
                                Quantity: 1,
                                Items: ['/' + key],
                            },
                        },
                    };

                    const invalidationCommand = new CreateInvalidationCommand(
                        invalidationParams,
                    );
                    await cloudFront.send(invalidationCommand);
                }),
            );
        }
    } catch (error) {
        next();
    }

    next();
});

exports.deleteProductsImages = catchAsync(async (req, res, next) => {
    const doc = await Product.findById(req.params.id);

    if (!doc) return next(new AppError('No document found with that ID', 404));

    // delete Cover Image
    const command = new DeleteObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: `products/${doc.coverImage}`,
    });
    await s3.send(command);

    // delete all the client images in the images in the bucket
    if (doc.images.length > 0) {
        await Promise.all(
            doc.images.map(async (image) => {
                const curCommand = new DeleteObjectCommand({
                    Bucket: process.env.BUCKET_NAME,
                    Key: `products/${image}`,
                });
                await s3.send(curCommand);
            }),
        );
    }

    req.coverImageinvalidationKey = doc.coverImage;
    req.imagesInvalidationKeyArray = doc.images;

    next();
});

exports.updateCloudfrontImageCache = async (req, res, next) => {
    if (!req.coverImageinvalidationKey && !req.imagesInvalidationKeyArray) return next();

    try {
        // invalidate the cache anytime we're deleting or updating the cover image
        if (req.coverImageinvalidationKey) {
            const invalidationParams = {
                DistributionId: process.env.PRODUCTS_DISTRIBUTION_ID,
                InvalidationBatch: {
                    CallerReference: `${req.coverImageinvalidationKey}-${Date.now()}`,
                    Paths: {
                        Quantity: 1,
                        Items: ['/' + req.coverImageinvalidationKey],
                    },
                },
            };
            const invalidationCommand = new CreateInvalidationCommand(invalidationParams);
            await cloudFront.send(invalidationCommand);
        }

        // invalidate the cache anytime we're deleting or updating the images
        if (req.imagesInvalidationKeyArray) {
            await Promise.all(
                req.imagesInvalidationKeyArray.map(async (key) => {
                    const invalidationParams = {
                        DistributionId: process.env.PRODUCTS_DISTRIBUTION_ID,
                        InvalidationBatch: {
                            CallerReference: `${key}-${Date.now()}`,
                            Paths: {
                                Quantity: 1,
                                Items: ['/' + key],
                            },
                        },
                    };

                    const invalidationCommand = new CreateInvalidationCommand(
                        invalidationParams,
                    );
                    await cloudFront.send(invalidationCommand);
                }),
            );
        }
    } catch (error) {
        // if we are sending a delete request with this function, we dont want to send an error to the client, since the image has already deleted from the bucket the cache will be cleared in 24hrs
        if (req.method === 'DELETE') {
            return next();
        }

        console.log(error);
        next(error);
    }

    next();
};

exports.getProductSlug = catchAsync(async (req, res, next) => {
    const doc = await Product.findOne({ slug: req.params.slug });

    if (!doc) {
        next(new AppError('There is no product with that name.', 404));
    }

    doc.coverImageUrl = process.env.PRODUCTS_CLOUD_FRONT_URL + doc.coverImage;
    for (const imgPath of doc.images) {
        const curUrl = process.env.PRODUCTS_CLOUD_FRONT_URL + imgPath;
        doc.imagesUrl.push(curUrl);
    }

    // Find the next document
    const nextDocument = await Product.findOne({
        _id: { $gt: doc._id },
    })
        .sort({ _id: 1 })
        .select('slug');

    // Find the previous document
    const previousDocument = await Product.findOne({
        _id: { $lt: doc._id },
    })
        .sort({ _id: -1 })
        .select('slug');

    // Add the routes to the document
    if (nextDocument) {
        doc.nextProductSlug = nextDocument.slug;
    }
    if (previousDocument) {
        doc.prevProductSlug = previousDocument.slug;
    }

    // // get the next document
    // const sortCriteria = { _id: 1 };
    // const cursor = await Product.find({ _id: { $gt: doc._id } })
    //     .sort(sortCriteria)
    //     .select('slug')
    //     .cursor();

    // const nextDoc = await cursor.next();
    // // if there is a next document
    // if (nextDoc) {
    //     doc.nextProductSlug = nextDoc.slug;
    // }

    res.status(200).json({
        status: 'success',
        data: doc,
    });
});

exports.searchProducts = catchAsync(async (req, res, next) => {
    const query = req.query.q || '';
    const sortby = req.query.sort.split(/(?<=-)/);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let field = '';
    let direction;
    if (sortby.length === 2) {
        // descending
        field = sortby[1];
        direction = -1;
    } else {
        // ascending
        field = sortby[0];
        direction = 1;
    }

    // Split the query into individual search terms
    const terms = query.split(' ').filter((term) => term.trim() !== '');

    const aggregationPipeline = [
        {
            $match: {
                $and: terms.map((term) => ({
                    $or: [
                        { name: { $regex: term, $options: 'i' } }, // i means Case-insensitive search on product name
                        { category: { $regex: term, $options: 'i' } },
                        { platform: { $regex: term, $options: 'i' } },
                        { brand: { $regex: term, $options: 'i' } },
                    ],
                })),
            },
        },
        {
            $facet: {
                metadata: [{ $count: 'total' }],
                data: [
                    { $sort: { [field]: direction } },
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $project: {
                            category: 0,
                            platform: 0,
                            brand: 0,
                            ratings: 0,
                            size: 0,
                            createdAt: 0,
                            images: 0,
                            imagesUrl: 0,
                            __v: 0,
                        },
                    },
                ],
            },
        },
    ];

    const productResults = await Product.aggregate(aggregationPipeline);

    const { metadata, data } = productResults[0];

    const totalCount = metadata[0]?.total || 0;

    if (data?.length > 0) {
        for (const product of data) {
            product.coverImageUrl =
                process.env.PRODUCTS_CLOUD_FRONT_URL + product.coverImage;
        }
    }

    res.status(200).json({
        status: 'success',
        count: totalCount,
        results: data.length,
        data: data,
    });
});

exports.aliasHotDeals = (req, res, next) => {
    req.query.offers = 'hot-deals';
    req.query.limit = '12';
    req.query.fields = 'name,originalPrice,price,coverImage,slug';

    next();
};
exports.aliasRecentProducts = (req, res, next) => {
    req.query.sort = '-createdAt';
    req.query.limit = '12';
    req.query.fields = 'name,originalPrice,price,coverImage,slug';
    next();
};

exports.getAllProducts = factory.getAll(Product, true, 'coverImage', 'coverImageUrl');
exports.getProduct = factory.getOne(Product, true, 'coverImage', 'coverImageUrl');

exports.createProduct = factory.createOne(Product);
exports.updateProduct = factory.updateOne(Product);
exports.deleteProduct = factory.deleteOne(Product);
