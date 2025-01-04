const mongoose = require('mongoose');
const SaveTask = require('../model/savetaskmodel');
//const Task = require('../model/taskModel');

const saveTask = async (req, res) => {
  const { userId, taskId } = req.body;

  // Validate input
  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(taskId)
  ) {
    return res
      .status(400)
      .json({ status: false, msg: 'Invalid userId or taskId' });
  }

  try {
    // Check if the task is already saved for the user
    const existingSave = await SaveTask.find({ taskId, userId });
    if (existingSave.length > 0) {
      return res
        .status(403)
        .json({ status: false, msg: 'Task is already saved' });
    }

    // Create and save the new SaveTask
    const savedTask = await SaveTask.create({ userId, taskId });
    res.status(200).json({ status: true, data: savedTask });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
};

const getSavedTasks = async (req, res) => {
  const { userId } = req.params;

  // Validate input
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ status: false, msg: 'Invalid userId' });
  }

  try {
    // Fetch all saved tasks for the user
    const savedTasks = await SaveTask.find({ userId }).populate({
      path: 'taskId',
      populate: {
        path: 'userId',
        select: 'email  UserName avatar title',
      },
    });

    if (!savedTasks || savedTasks.length === 0) {
      return res
        .status(404)
        .json({ status: false, msg: 'No saved tasks found for this user' });
    }

    // Filter out tasks that are null
    const tasks = savedTasks.filter(savedTask => savedTask.taskId !== null);

    res.status(200).json({ status: true, data: tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, error: 'Server error' });
  }
};

const deleteSaveTask = async (req, res) => {
  const { saveTaskId } = req.params;
  if (!saveTaskId) {
    return res.status(400).json({
      status: false,
      msg: 'Please provide a valid SavetaskId for deleting the SaveTask',
    });
  }

  if (!mongoose.Types.ObjectId.isValid(saveTaskId)) {
    return res.status(400).json({ status: false, msg: 'Invalid saveTaskId' });
  }

  try {
    const result = await SaveTask.deleteOne({ _id: saveTaskId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ status: false, msg: 'SaveTask not found' });
    }

    res
      .status(200)
      .json({ status: true, msg: 'SaveTask deleted successfully' });
  } catch (error) {
    res.status(500).json({ status: false, error: 'Server error' });
  }
};

module.exports = { saveTask, getSavedTasks, deleteSaveTask };
