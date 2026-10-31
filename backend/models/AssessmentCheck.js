const mongoose = require('mongoose');

const assessmentCheckSchema = new mongoose.Schema(
  {
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
      required: [true, 'Assessment ID is required'],
      index: true,
    },
    checkName: {
      type: String,
      required: [true, 'Check name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['headers', 'ssl_tls', 'https', 'dns', 'cookies', 'general'],
      default: 'general',
    },
    result: {
      type: String,
      enum: ['passed', 'failed', 'warning', 'unable_to_assess'],
      required: [true, 'Check result is required'],
    },
    status: {
      type: String,
      default: 'completed',
    },
    scoreImpact: {
      type: Number,
      default: 0,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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

assessmentCheckSchema.index({ assessmentId: 1, checkName: 1 });

const AssessmentCheck = mongoose.model('AssessmentCheck', assessmentCheckSchema);

module.exports = AssessmentCheck;
