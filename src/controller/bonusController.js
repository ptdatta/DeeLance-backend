const mongoose = require('mongoose');
const User = require('../model/userModel');
const Bonus = require('../model/bonusModel');

const bonus = async (req, res) => {
  const data = req.body;
  if (data.length === 0) {
    res.status(400).send({ status: false, msg: 'field is required' });
  }
  const savedata = await Bonus.create(data);
  res.json({ msg: 'Bonus added Successfully', status: true, data: savedata });
};

const getBonuse = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('bonuses');
    if (!user) {
      return res.status(404).send('User not found');
    }

    const bonuses = await Bonus.find();
    const availableBonuses = bonuses.filter(
      _bonus => !user.bonuses.includes(_bonus._id),
    );
    res.json({ bonuses: availableBonuses });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

const userUserIdClaimBonusByBonusId = async (req, res) => {
  const { userId, bonusId } = req.params;
  const user = await User.findById(userId).populate('tasks'); // Assicurati che 'tasks' sia il nome corretto

  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(bonusId)
  ) {
    return res.status(400).send('Invalid ID');
  }

  if (user.bonuses.includes(bonusId)) {
    return res.status(400).send('Bonus already claimed');
  }

  const _bonus = await Bonus.findById(bonusId);
  if (!_bonus) {
    return res.status(404).send('Bonus not found');
  }

  // if (_bonus.title === 'Complete your profile!' && !isProfileComplete(user)) {
  if (_bonus.title === 'Complete your profile!') {
    return res.status(400).send('Profile is not complete');
  }

  if (_bonus.title === 'Create your first Task!' && user.tasks.length === 0) {
    return res.status(400).send('No tasks created');
  }

  user.points += _bonus.points;
  user.bonuses.push(bonusId);
  await user.save();

  res.status(200).send('Bonus claimed successfully');
};

module.exports = { bonus, getBonuse, userUserIdClaimBonusByBonusId };
