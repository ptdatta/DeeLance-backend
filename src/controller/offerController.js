const mongoose = require('mongoose');
const Offer = require('../model/offerModel'); // Ensure the correct path
const Task = require('../model/taskModel');
const User = require('../model/userModel');

const CreateOffer = async (req, res) => {
  const { buyer, task, deadline, offerPrice } = req.body;

  if (!mongoose.Types.ObjectId.isValid(buyer)) {
    return res.status(400).json({ status: false, msg: 'Invalid buyer ID' });
  }
  if (!mongoose.Types.ObjectId.isValid(task)) {
    return res.status(400).json({ status: false, msg: 'Invalid task ID' });
  }

  try {
    const existingUser = await User.findById(buyer);
    if (!existingUser) {
      return res.status(404).json({ status: false, msg: 'User not found' });
    }

    const existingTask = await Task.findById(task);
    if (!existingTask) {
      return res.status(404).json({ status: false, msg: 'Task not found' });
    }

    const newOffer = new Offer({
      buyer,
      task,
      deadline,
      offerPrice,
    });

    await newOffer.save();

    console.log(newOffer);

    res.status(201).json({ status: true, data: newOffer });
  } catch (error) {
    console.error('Error creating offer:', error);
    res.status(500).json({ error: error.message });
  }
};

const getOffer = async (req, res) => {
  try {
    // Use the user ID from the request parameters
    const { userId } = req.params;

    console.log('Received userId:', userId); // Log the received userId

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ status: false, msg: 'Invalid user ID' });
    }

    // Find tasks that belong to the specified user
    const userTasks = await Task.find({ userId: userId });

    if (!userTasks || userTasks.length === 0) {
      return res.status(404).json({
        status: false,
        msg: 'No tasks found for the user',
      });
    }

    const taskIds = userTasks.map(task => task._id);

    const offers = await Offer.find({ task: { $in: taskIds } })
      .populate({
        path: 'buyer',
        select: ' UserName avatar',
      })
      .populate('task')
      .select('-__v'); // Exclude __v field from offer details

    console.log('Offers:', offers);

    if (offers.length === 0) {
      return res.status(404).json({
        status: false,
        msg: 'No offers found for the user',
      });
    }

    res.status(200).json({
      status: true,
      msg: 'Offers fetched successfully',
      data: offers,
    });
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).json({ status: false, msg: 'Internal server error' });
  }
};

module.exports = { CreateOffer, getOffer };
