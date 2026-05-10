const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  paymentMethodDetails: {
    upiId: { type: String, default: 'admin@okicici' },
    upiName: { type: String, default: 'Pustakly Admin' },
    bankName: { type: String, default: 'HDFC Bank' },
    accountNumber: { type: String, default: '12345678901234' },
    ifscCode: { type: String, default: 'HDFC0001234' },
    accountName: { type: String, default: 'Pustakly Enterprises' },
    instructions: { type: String, default: 'Please transfer the exact amount and save the transaction screenshot.' }
  }
});

module.exports = mongoose.model('Settings', settingsSchema);
