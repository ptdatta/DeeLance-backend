const { check } = require('express-validator');
const Task = require('../model/taskModel');

const validateTaskTXStatusRule = [
  check('blockchainCreationStatus')
    .isIn(['init', 'success', 'failed'])
    .withMessage('Invalid status value'),
  check('taskId')
    .notEmpty()
    .withMessage('Task ID is required')
    .custom(async (taskId, { req }) => {
      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      // Check if the status is already 'success'
      if (task.blockchainCreationStatus === 'success') {
        throw new Error('Status cannot be changed once set to success');
      }

      req.task = task; // Attach the task to the request object
    }),
];

module.exports = { validateTaskTXStatusRule };
