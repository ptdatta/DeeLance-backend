const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'jobPost',
      required: true,
    },
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    coverLetter: { type: String, required: true },
    proposedRate: { type: Number, required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('proposal', proposalSchema);
