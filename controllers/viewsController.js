const Tour = require('./../models/tourModels');
const catchAsync = require('./../utils/catchAsync');
const NewAppError = require('./../utils/appError');
const Booking = require('./../models/bookingModel');

exports.overview = catchAsync(async (req, res) => {
  //1 get tour data
  const tours = await Tour.find();
  //2build template
  //3 render the template using data from step 1
  res.status(200).render('overview', { title: 'All Tours', tours });
});

exports.tour = catchAsync(async (req, res, next) => {
  //1get tour data
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating  user'
  });
  if (!tour)
    return next(
      new NewAppError('There is no tour matching with this name', 404)
    );
  //2 build template
  //3 render the template using data from step 1
  res.status(200).render('tour', { title: `${tour.name}`, tour });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into Your Account'
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your Account details'
  });
};
exports.getMyTours = catchAsync(async (req, res, next) => {
  //1 find the bookings
  const bookings = await Booking.find({ user: req.user.id });
  //2 find the tours related to bookings
  const tourIds = bookings.map(el => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIds } });
  res.status(200).render('overview', {
    title: 'My Bookings',
    tours
  });
});
