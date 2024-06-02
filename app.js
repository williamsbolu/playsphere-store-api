const express = require('express');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');

const productRouter = require('./routes/productRoutes');
const cartRouter = require('./routes/cartRoutes');
const userRouter = require('./routes/userRoutes');
const wishlistRouter = require('./routes/wishlistRoutes');
const addressRouter = require('./routes/addressRoutes');
const orderRouter = require('./routes/orderRoutes');
const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');

const app = express();

// implement CORS
app.use(cors());
app.options('*', cors());

// serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers "helmet()"
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Limit request from same APIs
const limiter = rateLimit({
    limit: 100,
    windowMs: 60 * 60 * 1000, // 1hr in milliseconds
    message: 'Too many request from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Body Parser, Cookie parser, form data parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against xss
app.use(xss());

// Prevent parameter pollution // whitelist is an array of properties for which we allow duplicate in the queryString
// app.use(hpp());
app.use(
    hpp({
        whitelist: ['name@example', 'duration@example'],
    }),
);

app.use(compression());

app.use((req, res, next) => {
    next();
});

app.use('/api/v1/products', productRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/wishlist', wishlistRouter);
app.use('/api/v1/address', addressRouter);
app.use('/api/v1/orders', orderRouter);

app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
