const Cart = require('../models/cartModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const filterRequestBody = require('../utils/filterRequestBody');

exports.getAllCarts = factory.getAll(Cart);
exports.getCart = factory.getOne(Cart);
exports.createCart = factory.createOne(Cart, 'Cart');
exports.deleteCart = factory.deleteOne(Cart);

exports.filterCartRequestBody = (req, res, next) => {
    // Allow only updates to the cart quantity
    req.body = filterRequestBody(req.body, 'quantity');

    next();
};

exports.updateCartItem = factory.updateOne(Cart);

exports.importUserLocalCartData = catchAsync(async (req, res, next) => {
    const importedCartData = req.body;

    const cartItems = await Cart.find({ user: req.user.id });
    const existingCartIds = cartItems.map((cart) => cart.product._id); // array of existing cart "items" ids

    const filteredCartImports = [];

    importedCartData.forEach((curCart) => {
        // the "CartItems" is a mongoose Document object, so i had to convert the itemId to a string for d comparism
        // We check if any cart data in the "importedCartData" exist in the database, then we push the items that do no exist to the database
        const itemExistInDatabase = existingCartIds.find(
            (itemId) => itemId.toString() === curCart.item,
        );

        // push any Cart item that dosen't exist before in a database, if existingCartIds is empty, find() retuns undefined for all interation
        if (!itemExistInDatabase) {
            filteredCartImports.push(curCart);
        }
    });

    // console.log(filteredCartImports);

    const updatedCarts = await Cart.create(filteredCartImports);

    res.status(200).json({
        status: 'success',
        data: updatedCarts,
    });
});

exports.getUserCartData = catchAsync(async (req, res, next) => {
    // we get access to the req.user from the protect middleware
    const cartItems = await Cart.find({ user: req.user.id });

    let totalQuantity = 0;
    let totalAmount = 0;

    cartItems.forEach((cart) => {
        totalQuantity += cart.quantity;
        totalAmount += cart.itemPriceTotal;
    });

    // send response
    res.status(200).json({
        status: 'success',
        results: cartItems.length,
        data: {
            cartItems,
            totalQuantity,
            totalAmount,
        },
    });
});
