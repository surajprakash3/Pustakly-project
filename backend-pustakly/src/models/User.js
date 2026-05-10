const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin', 'seller'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  status: { type: String, enum: ['Pending', 'Active', 'Suspended'], default: 'Pending' },
  addresses: [{
    label: { type: String, default: 'Home' }, // Home, Work, etc.
    firstName: String,
    lastName: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    country: { type: String, default: 'India' },
    phone: String,
    isDefault: { type: Boolean, default: false }
  }],
  digitalLibrary: [{
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    purchaseDate: { type: Date, default: Date.now },
    format: { type: String, default: 'PDF' }
  }]
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
