const Wishlist = require('../models/wishlistModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');

exports.getAllWishlists = factory.getAll(Wishlist);
exports.deleteWishlist = factory.deleteOne(Wishlist);
exports.createWishlist = factory.createOne(Wishlist, 'Wishlist');

exports.getUserWishlistData = catchAsync(async (req, res, next) => {
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);
    const count = await Wishlist.countDocuments(queryObj);

    // we get access to the req.user from the protect middleware
    // const wishlistItems = await Wishlist.find({ user: req.user.id });

    const features = new APIFeatures(
        Wishlist.find({ user: req.user.id }),
        req.query,
    ).paginate();

    const wishlistItems = await features.query;

    wishlistItems.forEach((doc) => {
        doc.product.coverImageUrl = process.env.CLOUD_FRONT_URL + doc.product.coverImage;
    });

    // send response
    res.status(200).json({
        status: 'success',
        results: wishlistItems.length,
        count,
        data: wishlistItems,
    });
});

exports.importLocalWishlistData = catchAsync(async (req, res, next) => {
    const importedWishlist = req.body;

    const existingWishlists = await Wishlist.find({ user: req.user.id });
    const existingWishlistsIds = existingWishlists.map((data) => data.product._id); // array of existing wishlist "items" ids

    const filteredWishlistData = [];

    importedWishlist.forEach((curItem) => {
        // the "existingWishlists" is a mongoose Document object, so i had to convert the itemId to a string for d comparism
        // We check if any savedItem data in the "importedWishlist" exist in the database, then we push the items that do no exist to the database
        const itemExistInDatabase = existingWishlistsIds.find(
            (itemId) => itemId.toString() === curItem.item,
        );

        // push any saved item that dosen't exist before in the database, if existingsavedItemsIds is empty, find() retuns undefined for all interation
        if (!itemExistInDatabase) {
            filteredWishlistData.push(curItem);
        }
    });

    // console.log(filteredWishlistData);

    const updatedWishlist = await Wishlist.create(filteredWishlistData);

    res.status(200).json({
        status: 'success',
        data: updatedWishlist,
    });
});
