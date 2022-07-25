const express = require('express');
const authController = require('./../controllers/authController');
const userController = require('./../controllers/userController');
const router = express.Router();
router.post('/signup', authController.signUp);
router.post('/signin', authController.signIn);
router.get('/logout', authController.logOut);
router.post('/forgotpassword', authController.forgotPassword);
router.patch('/resetpassword/:token', authController.resetPassword);
//protect all routes after this middlewares
router.use(authController.protect);
router.patch('/updatepassword', authController.updatePassword);
router.patch(
  '/updateme',
  userController.uploadUserData,
  userController.resizeUserPhotos,
  userController.updateMe
);
router.delete('/deleteme', userController.deleteMe);
router.get('/me', userController.getMe, userController.getUser);

//restrict to admin only
router.use(authController.restrictTo('admin'));
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
