const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
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
  gigId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  BlockchainGigId: { type: String },
  initialTransactionHash: { type: String },
  total: { type: Number, required: true },
  deadline: { type: Date },
  delivered: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: [
      'awaiting-freelancer-approval',
      'active',
      'delivered',
      'completed',
      'disputed',
      'cancelled',
      'freelancer-declined',
      'client-withdrawn',
      'revision',
    ],
    default: 'awaiting-freelancer-approval',
  },
  files: [
    {
      type: String, // URL to Cloudinary or local file path
    },
  ],
  dispute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dispute',
  },
  revision: { type: Number, default: 3 },
  reasonForDecline: {
    type: String,
    maxlength: 160,
    required: false,
  },
});

orderSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
