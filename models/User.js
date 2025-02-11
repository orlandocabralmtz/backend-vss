const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User schema definition
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // Ensures that there are no duplicate emails
    match: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/, // Basic email validation
  },
  password: {
    type: String,
    required: true,
    minlength: 6, // Ensures the password is at least 6 characters long
  },
  role: {
    type: String,
    enum: ['admin', 'junior', 'readonly'], // Predefined roles
    default: 'junior', // Default value if no role is specified
  },
});

// Encrypt the password before saving the user
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next(); // If the password was not modified, do nothing
  try {
    const salt = await bcrypt.genSalt(10); // Generate a salt to encrypt the password
    this.password = await bcrypt.hash(this.password, salt); // Encrypt the password
    next(); // Continue with the save process
  } catch (err) {
    next(err); // If there's an error, pass it to the next middleware
  }
});

// Method to check if the entered password matches the stored password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password); // Compare the entered password with the encrypted one
};

const User = mongoose.model('User', userSchema);

module.exports = User;
