const mongoose = require('mongoose');

const bonusSchema = new mongoose.Schema({
  // userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  points: { type: Number, required: true },
});

module.exports = mongoose.model('Bonus', bonusSchema);
