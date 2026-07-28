const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [120, 'Project name cannot be longer than 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot be longer than 2000 characters'],
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // The owner is kept in here as well, so "can this person see the project?"
    // is a single membership check instead of two.
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

// Every project list is scoped by membership, so that is the query worth indexing.
projectSchema.index({ members: 1 });

projectSchema.set('toJSON', {
  transform: (document, plain) => {
    delete plain.__v;
    return plain;
  },
});

module.exports = mongoose.model('Project', projectSchema);
