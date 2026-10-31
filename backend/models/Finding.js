const mongoose = require('mongoose');

const findingSchema = new mongoose.Schema(
  {
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
      required: [true, 'Assessment ID is required'],
      index: true,
    },
    category: {
      type: String,
      enum: ['headers', 'ssl_tls', 'https', 'dns', 'cookies', 'general'],
      required: [true, 'Category is required'],
    },
    title: {
      type: String,
      required: [true, 'Finding title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Finding description is required'],
    },
    severity: {
      type: String,
      enum: ['Critical', 'High', 'Medium', 'Low', 'Informational'],
      required: [true, 'Severity is required'],
      index: true,
    },
    evidence: {
      type: String,
      default: '',
    },
    recommendation: {
      type: String,
      required: [true, 'Remediation recommendation is required'],
    },
    status: {
      type: String,
      enum: ['open', 'resolved', 'ignored'],
      default: 'open',
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

findingSchema.index({ assessmentId: 1, severity: 1 });

const Finding = mongoose.model('Finding', findingSchema);

module.exports = Finding;
