// exports.searchProducts = catchAsync(async (req, res, next) => {
//     const query = req.query.q;
//     const page = Number(req.query.page) || 1;
//     const limit = Number(req.query.limit) || 20;
//     const skip = (page - 1) * limit;

//     const aggregationPipeline = [
//         {
//             $match: {
//                 $or: [
//                     { name: { $regex: query, $options: 'i' } }, // Case-insensitive search on product name
//                     { category: { $regex: query, $options: 'i' } }, // Case-insensitive search on description
//                     { platform: { $regex: query, $options: 'i' } }, // Case-insensitive search on description
//                     { brand: { $regex: query, $options: 'i' } }, // Case-insensitive search on description
//                 ],
//             },
//         },
//         {
//             $facet: {
//                 metadata: [{ $count: 'total' }],
//                 data: [
//                     { $sort: { name: -1 } },
//                     { $skip: skip },
//                     { $limit: limit },
//                     {
//                         $project: {
//                             category: 0,
//                             platform: 0,
//                             brand: 0,
//                             ratings: 0,
//                             size: 0,
//                             createdAt: 0,
//                             images: 0,
//                             imagesUrl: 0,
//                             __v: 0,
//                         },
//                     },
//                 ],
//             },
//         },
//     ];

//     const productResults = await Product.aggregate(aggregationPipeline);

//     const { metadata, data } = productResults[0];

//     const totalCount = metadata[0]?.total || 0;

//     if (data?.length > 0) {
//         for (const product of data) {
//             product.coverImageUrl = process.env.CLOUD_FRONT_URL + product.coverImage;
//         }
//     }

//     res.status(200).json({
//         status: 'success',
//         count: totalCount,
//         results: data.length,
//         data: data,
//     });
// });
