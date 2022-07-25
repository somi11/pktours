const path = require('path');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimiter = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const appError = require('./utils/appError');
const golbalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routers/tourRoutes');
const userRouter = require('./routers/userRoutes');
const reviewRouter = require('./routers/reviewRoutes');
const viewRouter = require('./routers/viewRoutes');
const bookingRouter = require('./routers/bookingRoutes');
const AppError = require('./utils/appError');
const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
// middlewares
//middle for serving static files
app.use(express.static(path.join(__dirname, 'public')));
//middleware for http security
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
//middleware to limit traffic from single ip
const limiter = rateLimiter({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'To many attempts from this IP. Please try after one hour'
});
app.use('/api', limiter);
//middleware bodyparser reading data from body to req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ urlencoded: true, limit: '10kb' }));
//middleware to pass data from cookieParser
app.use(cookieParser());
//data sanitization against nosql query injections
app.use(mongoSanitize());
//data sanitization against xss
app.use(xssClean());
//middleware for http parameter polution cleaning
app.use(
  hpp({
    whitelist: [
      'duration',
      'maxGroupSize',
      'ratingsAverage',
      'ratingsQuantity',
      'difficulty',
      'price'
    ]
  })
);
//test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //console.log(req.cookies);
  next();
});

//mounting routes
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);
app.all('*', (req, res, next) => {
  next(new appError(`Cant find the ${req.originalUrl} on this server`), 400);
});
app.use(golbalErrorHandler);
//start server
module.exports = app;
