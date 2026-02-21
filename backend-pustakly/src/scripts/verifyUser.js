// Usage: node scripts/verifyUser.js <email>
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/verifyUser.js <email>');
  process.exit(1);
}

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    console.error('User not found');
    process.exit(1);
  }
  user.isVerified = true;
  user.status = 'Active';
  await user.save();
  console.log('User verified:', user.email);
  process.exit(0);
};

run();
