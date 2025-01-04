const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  keywords: [{ type: String }],
  pricingTitle: { type: String },
  description: { type: String, required: true },
  deliveryDays: { type: Number },
  price: { type: Number, required: true },
  packageDescription: { type: String },
  images: [
    {
      url: { type: String },
    },
  ],
  isPublish: { type: Boolean, default: false },
  faqs: [{ question: String, answer: String }],
  subCategory: { type: String },
  category: { type: String },
  revision: { type: String },
  blockchainCreationStatus: {
    type: String,
    enum: ['init', 'success', 'failed'],
    default: 'init',
  },
});

const Task = mongoose.model('Task', taskSchema);
module.exports = Task;
