const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndDelete(req.params.id);

        if (!doc) {
            // if null: there's no tour // This logic is for handlers querying documents based on id
            return next(new AppError('No document found with that ID', 404));
        }

        res.status(204).json({
            status: 'success',
            data: null,
        });
    });

exports.updateOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!doc) {
            // if null: there's no document // This logic is for handlers querying documents based on id
            return next(new AppError('No document found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: doc,
        });
    });

exports.createOne = (Model, modelType) =>
    catchAsync(async (req, res, next) => {
        // this runs when we're creating a cart item and saved item, and fills the user field with the id gotten from d protect middleware
        if (modelType) req.body.user = req.user.id;

        const doc = await Model.create(req.body); // saves d document in d database & returns d newly creatd document with d id

        res.status(201).json({
            status: 'success',
            data: doc,
        });
    });

exports.getOne = (Model, imageFile = false, ...imgPathInfo) =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findById(req.params.id);

        if (!doc) {
            return next(new AppError('No document found with that ID', 404));
        }

        const CLOUD_FRONT_URL =
            imgPathInfo[0] === 'photo'
                ? process.env.USERS_CLOUD_FRONT_URL
                : process.env.PRODUCTS_CLOUD_FRONT_URL;

        // runs mostly when this is function is called in the product controller: (the "imageFile" will be true)
        if (imageFile || doc?.photo?.startsWith('user')) {
            doc[imgPathInfo[1]] = CLOUD_FRONT_URL + doc[imgPathInfo[0]];

            if (doc?.images && doc?.images.length > 0) {
                // switch iterators to the forEach loop
                for (const imgPath of doc.images) {
                    const curUrl = CLOUD_FRONT_URL + imgPath;
                    doc.imagesUrl.push(curUrl);
                }
            }
        }

        res.status(200).json({
            status: 'success',
            data: doc,
        });
    });

exports.getAll = (Model, imageFile = false, ...imgPathInfo) =>
    catchAsync(async (req, res, next) => {
        // for caculating the total document count without pagination
        const queryObj = { ...req.query };
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach((el) => delete queryObj[el]);
        const count = await Model.countDocuments(queryObj);

        const features = new APIFeatures(Model.find(), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();

        const doc = await features.query;

        if (imageFile) {
            for (const curDoc of doc) {
                curDoc[imgPathInfo[1]] =
                    process.env.PRODUCTS_CLOUD_FRONT_URL + curDoc[imgPathInfo[0]];
            }
        }

        // SEND RESPONSE
        res.status(200).json({
            status: 'success',
            results: doc.length,
            count,
            data: doc,
        });
    });
