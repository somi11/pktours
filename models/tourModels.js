const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const User = require('./userModel');
//schema
const tourschema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have name'],
      unique: true,
      trim: true,
      maxLength: [40, 'A tour name must be less than 40 characters'],
      minLength: [10, 'A tour name must have minimum 10 characters'],
      //validate: [validator.isAlpha, 'Tour name must only contain characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have valid duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have Group Size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have difficulty set'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either easy medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Minimum rating must be greater than 1'],
      max: [5, 'Maximum rating must be not be greater than 5'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have price'],
    },
    priceDiscout: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'Discount cannot be greater than price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have imageCover'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],

    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //geojson
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tourschema.index({ price: 1, ratingsAverage: -1 });
tourschema.index({ slug: 1 });
tourschema.index({ startLocation: '2dsphere' });

//Document Middleware runs before .save() or .create()
tourschema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourschema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });
///Middle runs aftr save

// tourschema.post('save', function (doc, next) {
//   next();
// });

//middle where before query

tourschema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourschema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt ',
  });
  next();
});
tourschema.post(/^find/, function (next) {
  console.log(`${Date.now() - this.start} were used by Query `);
});

//middleware agregation
// tourschema.pre('aggregate', function () {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
// });

tourschema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

tourschema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});
const Tour = mongoose.model('Tour', tourschema);

module.exports = Tour;
