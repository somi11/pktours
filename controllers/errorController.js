const AppError = require('./../utils/appError');
const handleCastErrorDB = err => {
  const message = `Invaild ${err.path} : ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const message = 'Duplicate field';
  return new AppError(message, 400);
};
const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invaild input Data ${errors.join('. ')}`;
  return new AppError(message, 400);
};
const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      err: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });
  }
};
const sendErroProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    } else {
      console.error('Error', err);
      res.status(500).json({
        status: 'error',
        message: 'Something went Wrong'
      });
    }
  } else {
    if (err.isOperational) {
      res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: err.message
      });
    } else {
      res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: 'Please Try Again!'
      });
    }
  }
};

const handleJWTError = () =>
  new AppError('Invalid token. Please Login Again', 401);

const handleJWTExpiredError = () =>
  new AppError('Token Expired. Please Login Again', 401);
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidatorError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    sendErroProd(error, req, res);
  }
};
