// const mongoose = require('mongoose');
// const Task = require('./taskModel');

// const OfferSchema = new mongoose.Schema(
//   {
//     buyer: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       required: true,
//     },
//     task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
//     // paymentTerms: { type: String, required: true },
//     deadline: { type: Date, required: true },
//     offerPrice: { type: Number },
//     status: {
//       type: String,
//       enum: ['pending', 'accepted', 'rejected'],
//       default: 'pending',
//     },
//   },
//   {
//     timestamps: true,
//   },
// );

// //
// OfferSchema.pre('validate', async function (req, res, next) {
//   try {
//     const task = await Task.findById(this.task);
//     if (!task) {
//       return res.status(400).json({ status: false, msg: 'Task not found' });
//     }

//     if (!this.offerPrice) {
//       this.offerPrice = task.price;
//     }
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// module.exports = mongoose.model('Offer', OfferSchema);

const mongoose = require('mongoose');
const Task = require('./taskModel');

const OfferSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    deadline: { type: Date, required: true },
    offerPrice: { type: Number },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  },
);

OfferSchema.pre('validate', async function (next) {
  try {
    const task = await Task.findById(this.task);
    if (!task) {
      return next(new Error('Task not found'));
    }

    if (!this.offerPrice) {
      this.offerPrice = task.price;
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Offer', OfferSchema);
