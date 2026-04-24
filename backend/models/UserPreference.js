const mongoose = require('mongoose');

const keywordSchema = new mongoose.Schema(
  {
    value: {
      type: String,
      required: true,
      trim: true,
    },
    source: {
      type: String,
      enum: ['search', 'view', 'click', 'dwell', 'cart', 'order', 'seed'],
      default: 'view',
    },
    score: {
      type: Number,
      default: 1,
      min: 0,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const userPreferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      unique: true,
      required: true,
      index: true,
    },
    keywords: {
      type: [keywordSchema],
      default: [],
      validate: {
        validator(value) {
          return value.length <= 50;
        },
        message: 'A user preference profile can only store up to 50 keywords',
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserPreference', userPreferenceSchema);
