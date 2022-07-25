const catchAsync = require('./../utils/catchAsync');
const User = require('./../models/userModel');
const NewAppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const multer = require('multer');
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img/users');
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  }
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new NewAppError('Not an image please upload images only', 400), false);
  }
};
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadUserData = upload.single('photo');

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
exports.resizeUserPhotos = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  next();
});
exports.updateMe = catchAsync(async (req, res, next) => {
  //1 create error if user try to update pasword
  if (req.body.password || req.body.passwordConfirm) {
    return next(new NewAppError('Password cannot be updated here', 400));
  }
  //2 filtered out unwanted fields that are not supposed to be altered
  const filterBody = filterObj(req.body, 'name', 'email');
  if (req.file) filterBody.photo = req.file.filename;
  //3 update the document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
    new: true,
    runValidators: true
  });
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.user.id, { active: false });
  if (!user) console.log('not found');
  res.status(204).json({
    status: 'sucess',
    data: null
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'Users not defined Yet Please USE signup instead'
  });
};
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
