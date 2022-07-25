const crypto = require('crypto');
const { promisify } = require('util');
const User = require('./../models/userModel');
const jwt = require('jsonwebtoken');
const catchAsync = require('./../utils/catchAsync');
const NewAppError = require('./../utils/appError');
const Email = require('./../utils/email');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SERCRET, {
    expiresIn: process.env.JWT_EXPIRES
  });
};

const createSendToken = (user, statuCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;
  res.status(statuCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};
exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, res);
});

exports.signIn = catchAsync(async (req, res, next) => {
  //1 check if email and password exists
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new NewAppError('Please enter email and password', 400));
  }
  //2 check if user exists and email and password match
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new NewAppError('Incorrect email or password', 401));
  }
  createSendToken(user, 200, res);
});

exports.logOut = (req, res) => {
  res.cookie('jwt', ' loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({
    status: 'success'
  });
};
exports.protect = catchAsync(async (req, res, next) => {
  //1  get token and check if its there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new NewAppError('You are not loggged in. Please login to get access', 401)
    );
  }
  console.log(token);
  //2 verfication token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SERCRET);
  //3 check if the user exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(
      new NewAppError('The user belonging to the token doesnot exist', 401)
    );
  //4 check if the user has not changed the password after token was issued

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new NewAppError(
        'The user recently changed the pasword! Please Login again',
        401
      )
    );
  }

  //Access to protected Route
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

//only for rendered pages so no errors

exports.isLoggedIn = async (req, res, next) => {
  //1  get token and check if its there

  if (req.cookies.jwt) {
    try {
      //verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SERCRET
      );
      //3 check if the user exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) return next();
      //4 check if the user has not changed the password after token was issued

      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      //there is a logggedin user
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }

  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles[] containing admin or leadguide
    if (!roles.includes(req.user.role)) {
      return next(
        new NewAppError('You dont have permission to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1 get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new NewAppError('No user is linked to the provided email', 404)
    );
  }
  //2 generate the random test token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  // const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}. \n if you
  // didnot request then please ignore this email`;

  try {
    //   await sendEmail({
    //     email: user.email,
    //     subject: 'You password reset token (valid for 10 min)',
    //     message
    //   });
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetpassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'Password Reset token has been emailed'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.log(err);
    return next(
      new NewAppError('There was error sending the email. Try again', 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1 get user based on token email
  const hasedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hasedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  //2 check if token has not expired and there is user and set new password
  if (!user) {
    return next(new NewAppError('token has expired please request again'), 400);
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //3 update changedpasswordat property
  //4log the user in send jwt
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1 get user from the collection of users
  const user = await User.findById(req.user.id).select('+password');
  //2 check if the posted pasword is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new NewAppError('Incorrect password', 401));
  }
  //3update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //4 log user in and send jwt
  createSendToken(user, 200, res);
});
