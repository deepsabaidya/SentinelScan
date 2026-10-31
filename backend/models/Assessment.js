const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    websiteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Website',
      required: [true, 'Website ID is required'],
      index: true,
    },
    targetUrl: {
      type: String,
      required: true,
      trim: true,
    },
    targetDomain: {
      type: String,
      required: true,
      trim: true,
    },
    securityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    securityGrade: {
      type: String,
      enum: ['Excellent', 'Good', 'Moderate', 'Needs Improvement', 'Poor', 'Pending'],
      default: 'Pending',
    },
    status: {
      type: String,
      enum: ['queued', 'in_progress', 'completed', 'failed'],
      default: 'queued',
      index: true,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    summary: {
      totalFindings: { type: Number, default: 0 },
      critical: { type: Number, default: 0 },
      high: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      low: { type: Number, default: 0 },
      informational: { type: Number, default: 0 },
      passedChecks: { type: Number, default: 0 },
      failedChecks: { type: Number, default: 0 },
      warningChecks: { type: Number, default: 0 },
      unableToAssess: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast history queries and dashboard aggregations
assessmentSchema.index({ userId: 1, createdAt: -1 });
assessmentSchema.index({ websiteId: 1, createdAt: -1 });

const Assessment = mongoose.model('Assessment', assessmentSchema);
const { wrapModel } = require('./modelWrapper');
const { MockAssessment } = require('./inMemoryStore');

module.exports = wrapModel(Assessment, MockAssessment);
