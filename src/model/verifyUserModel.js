const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
  title: String,
  companyName: String,
  location: String,
  locationType: String,
  employementType: String,
  currentlyWorkingHere: Boolean,
  startMonth: String,
  startYear: Number,
  endMonth: String,
  endYear: Number,
});

const otherDetailsSchema = new mongoose.Schema({
  timeZone: {
    region: String,
    timeZone: String,
  },
  payment: String,
  language: String,
});

const verifySchema = new mongoose.Schema({
  UserName: { type: String },
  email: { type: String, required: true },
  password: { type: String, required: true },
  wallet: { type: String },

  verified: { type: Boolean, default: false },
  verificationToken: { type: String },
  registrationDate: { type: Date, default: Date.now },
  isPrivate: { type: Boolean, default: false },
  bonuses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bonus' }],
  points: { type: Number, default: 0 },
  title: { type: String },
  description: { type: String },
  // skills: [{ type: String }],
  country: { type: String },
  token: { type: String },
  kind: { type: Number, default: 0 },
  referrer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  skills: [{ code: String, label: String }],
  accountType: {
    type: String,
    enum: ['FREELANCER', 'CLIENT'],
    default: 'FREELANCER',
    required: true,
  },
  education: [
    {
      school: String,
      degree: String,
      graduation_year: Number,
    },
  ],
  experience: [experienceSchema],
  otherDetails: otherDetailsSchema,
});
module.exports = mongoose.model('verify', verifySchema);
