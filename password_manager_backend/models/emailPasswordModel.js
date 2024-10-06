const mongoose = require('mongoose');

const emailPasswordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true
  },
  encryptedPassword: {
    type: String,
    required: true
  }
});

const EmailPassword = mongoose.model('EmailPassword', emailPasswordSchema);

module.exports = EmailPassword;