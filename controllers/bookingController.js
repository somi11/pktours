const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Tour = require('./../models/tourModels');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('./../models/bookingModel');
const factory = require('./../controllers/handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1 get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  const product = await stripe.products.create({
    name: `${tour.slug}`,
    description: tour.summary,
    images: [`https://www.natours.dev/img/tours/${tour.imageCover}`]
  });
  const price = await stripe.prices.create({
    unit_amount: tour.price,
    currency: 'eur',
    product: product.id
  });
  //2 ceate checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        // name: `${tour.name} Tour`,
        // description: tour.summary,
        // images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
        price: price.id,
        // currency: 'usd',
        //quantity: 1
        //price: price.product,
        quantity: 1
      }
    ],
    mode: 'payment'
  });
  //3 create session as response
  res.status(200).json({
    status: 'success',
    sess: session.url
  });
  //return res.redirect(303, session.url);
  //next();
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query;

  if (!user && !tour && !price) return next();
  await Booking.create({ tour, user, price });
  res.redirect(req.originalUrl.split('?')[0]);
});
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.createBooking = factory.createOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
