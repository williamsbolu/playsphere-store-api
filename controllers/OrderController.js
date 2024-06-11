const https = require('https');
const catchAsync = require('../utils/catchAsync');
const Order = require('../models/orderModel');
const factory = require('./handlerFactory');
const APIFeatures = require('../utils/apiFeatures');

exports.getPaystack = catchAsync(async (req, res, next) => {
    const { email, amount, order } = req.body;

    await Order.create(order);

    const params = JSON.stringify({
        email: email,
        amount: amount * 100, // fix
    });

    // const options = {
    //     hostname: 'api.paystack.co',
    //     port: 443,
    //     path: '/transaction/initialize',
    //     method: 'POST',
    //     headers: {
    //         Authorization: 'Bearer sk_test_2fcb221bc96c3696ca9cc9356c9acce27890a4b0',
    //         'Content-Type': 'application/json',
    //     },
    // };

    // const reqPaystack = https
    //     .request(options, (resPaystack) => {
    //         let data = '';

    //         resPaystack.on('data', (chunk) => {
    //             data += chunk;
    //         });

    //         resPaystack.on('end', () => {
    //             res.send(data);
    //             console.log(JSON.parse(data));
    //         });
    //     })
    //     .on('error', (error) => {
    //         console.error(error);
    //     });

    // reqPaystack.write(params);
    // reqPaystack.end();

    res.status(200).json({
        success: 'An order was created verifying transaction',
    });
});

exports.verifyPayment = catchAsync(async (req, res, next) => {
    const { reference } = req.params.reference;

    const options = {
        hostname: 'api.paystack.co',
        port: 443,
        path: `/transaction/verify/${reference}`,
        method: 'GET',
        headers: {
            Authorization: 'Bearer SECRET_KEY',
        },
    };

    const paystackReq = https
        .request(options, (paystackRes) => {
            let data = '';

            paystackRes.on('data', (chunk) => {
                data += chunk;
            });

            paystackRes.on('end', () => {
                const response = JSON.parse(data);
                if (response.status && response.data.status === 'success') {
                    // Find the order by reference and update its status
                    // Example: Order.findOneAndUpdate({ reference }, { status: 'paid' });
                    res.status(200).json({
                        message: 'Payment successful',
                        order: response.data,
                    });
                } else {
                    res.json({
                        message: 'Payment verification failed',
                        order: response.data,
                    });
                }
            });
        })
        .on('error', (error) => {
            console.log(error);
            res.status(500).json({
                error: 'An error occurred while verifying transaction',
            });
        });

    paystackReq.end();
});

exports.getUserOrders = catchAsync(async (req, res, next) => {
    // we get access to the req.user from the protect middleware
    const userOrders = await Order.find({ user: req.user.id });

    // send response
    res.status(200).json({
        status: 'success',
        results: userOrders.length,
        data: userOrders,
    });
});

exports.getAllOrders = catchAsync(async (req, res, next) => {
    // for caculating the total document count without pagination
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);
    const count = await Order.countDocuments(queryObj);

    const features = new APIFeatures(Order.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const orders = await features.query;

    // add the product image url
    orders.forEach((order) => {
        order.products.forEach((productItem) => {
            productItem.product.coverImageUrl =
                process.env.PRODUCTS_CLOUD_FRONT_URL + productItem.product.coverImage;
        });
    });

    res.status(200).json({
        status: 'success',
        results: orders.length,
        count,
        data: orders,
    });
});

exports.getOrder = factory.getOne(Order);
exports.createOrder = factory.createOne(Order);
