const mongoose = require('mongoose');

const {
  TASK_STATUSES,
  TASK_STATUS_VALUES,
  TASK_PRIORITIES,
  TASK_PRIORITY_VALUES,
} = require('../constants');

const taskSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot be longer than 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, 'Description cannot be longer than 5000 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: TASK_STATUS_VALUES,
      default: TASK_STATUSES.TODO,
    },
    priority: {
      type: String,
      enum: TASK_PRIORITY_VALUES,
      default: TASK_PRIORITIES.MEDIUM,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Unassigned is a normal state for a fresh task, so null rather than required.
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// Tasks are always read one project at a time, usually narrowed by status.
taskSchema.index({ project: 1, status: 1 });

taskSchema.set('toJSON', {
  transform: (document, plain) => {
    delete plain.__v;
    return plain;
  },
});

module.exports = mongoose.model('Task', taskSchema);
