const { CloudFrontClient } = require('@aws-sdk/client-cloudfront');

const cloudFront = new CloudFrontClient({
    region: process.env.BUCKET_REGION,
    credentials: {
        accessKeyId: process.env.ACCESS_KEY,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
    },
});

module.exports = cloudFront;
