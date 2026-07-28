const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { ROLES, ROLE_VALUES } = require('../constants');

const SALT_ROUNDS = 10;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [80, 'Name cannot be longer than 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      // Left out of every query result unless a caller explicitly asks for it.
      select: false,
    },
    role: {
      type: String,
      enum: ROLE_VALUES,
      default: ROLES.MEMBER,
    },
  },
  { timestamps: true }
);

// Hashing lives on the model rather than in the service, so there is no code path
// that can store a plain password by accident.
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  return next();
});

userSchema.methods.matchesPassword = function matchesPassword(plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

// Belt and braces: even if someone selects the hash, it never reaches the response.
userSchema.set('toJSON', {
  transform: (document, plain) => {
    delete plain.password;
    delete plain.__v;
    return plain;
  },
});

module.exports = mongoose.model('User', userSchema);
