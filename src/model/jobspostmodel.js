const mongoose = require('mongoose');

const jobPostSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobTitle: { type: String, required: true },
  jobType: { type: String, required: true },
  jobTiming: { type: String, required: true },
  jobRequirements: { type: String, required: true },
  salaryType: { type: String, required: true },
  salaryMin: { type: Number, required: true },
  salaryMax: { type: Number, required: true },
  salaryRate: { type: String, required: true },
  supplementalPay: { type: String, required: false },
  benefits: [{ type: String, required: false }],
  language: { type: String, required: true },
  hiringAmount: { type: Number, required: true },
  hiringUrgency: { type: String, required: true },
  creationDate: { type: Date, default: Date.now },
});

const JobPost = mongoose.model('JobPost', jobPostSchema);
module.exports = JobPost;
