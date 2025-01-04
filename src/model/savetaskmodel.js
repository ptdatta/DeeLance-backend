const mongoose = require('mongoose');

const saveTaskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('SaveTask', saveTaskSchema);
