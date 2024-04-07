const Promotion = require('../models/promotionModel');
const factory = require('./handlerFactory');

exports.getAllPromotion = factory.getAll(Promotion);
exports.createPromotion = factory.createOne(Promotion);
exports.deletePromotion = factory.deleteOne(Promotion);
