const mongoose = require('mongoose');

const websiteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner userId is required'],
      index: true,
    },
    url: {
      type: String,
      required: [true, 'Website URL is required'],
      trim: true,
    },
    domain: {
      type: String,
      required: [true, 'Domain is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    lastScore: {
      type: Number,
      default: null,
    },
    lastGrade: {
      type: String,
      default: null,
    },
    lastAssessedAt: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying user websites by domain
websiteSchema.index({ userId: 1, domain: 1 });

const Website = mongoose.model('Website', websiteSchema);

module.exports = Website;
