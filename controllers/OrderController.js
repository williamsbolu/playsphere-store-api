const https = require('https');
const catchAsync = require('../utils/catchAsync');

exports.getPaystack = catchAsync(async (req, res, next) => {
    console.log(req.query);
    const params = JSON.stringify({
        email: req.query.email,
        amount: req.query.amount,
    });
    // const params = JSON.stringify({
    //     email: req.body.email,
    //     amount: req.body.amount,
    //     firetName: req.body.firstName,
    //     lastName: req.body.lastName,
    // });

    const options = {
        hostname: 'api.paystack.co',
        port: 443,
        path: '/transaction/initialize',
        method: 'POST',
        headers: {
            Authorization: 'Bearer sk_test_2fcb221bc96c3696ca9cc9356c9acce27890a4b0',
            'Content-Type': 'application/json',
        },
    };

    const reqPaystack = https
        .request(options, (resPaystack) => {
            let data = '';

            resPaystack.on('data', (chunk) => {
                data += chunk;
            });

            resPaystack.on('end', () => {
                res.send(data);
                console.log(JSON.parse(data));
            });
        })
        .on('error', (error) => {
            console.error(error);
        });

    reqPaystack.write(params);
    reqPaystack.end();
});
