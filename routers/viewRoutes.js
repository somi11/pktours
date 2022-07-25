const express = require('express');
const viewController = require('./../controllers/viewsController');
const authController = require('./../controllers/authController');
const bookingController = require('./../controllers/bookingController');
const router = express.Router();

// router.get('/', (req, res) => {
//   res.status(200).render('base', { tour: 'Lahore Pakistan', user: 'somi' });
// });

router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewController.overview
);

router.get('/tours/:slug', authController.isLoggedIn, viewController.tour);

router.get('/login', authController.isLoggedIn, viewController.getLoginForm);

router.get('/me', authController.protect, viewController.getAccount);
router.get('/my-tours', authController.protect, viewController.getMyTours);
module.exports = router;
