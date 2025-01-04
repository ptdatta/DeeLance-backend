const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  freelancerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  images: [
    {
      url: { type: String },
    },
  ],
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['open', 'resolved', 'cancelled'],
    default: 'open',
  },
  cancellationReason: {
    type: String,
    required: false,
  },
  resolution: {
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    decision: {
      type: String,
      enum: ['refund', 'no-refund', 'partial-refund', 'other'],
    },
    resolutionDetails: {
      type: String,
    },
    resolutionDate: {
      type: Date,
    },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

disputeSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Dispute = mongoose.model('Dispute', disputeSchema);
module.exports = Dispute;
