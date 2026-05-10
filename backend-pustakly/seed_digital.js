const mongoose = require('mongoose');
const User = require('./src/models/User');
const Product = require('./src/models/Product');
require('dotenv').config();

async function seedDigitalBook() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const user = await User.findOne({ email: 'suraj@gmail.com' }); // Assuming this is the user
  if (!user) {
    console.log('User not found');
    process.exit(1);
  }

  const product = await Product.findOne(); // Just get any product
  if (!product) {
    console.log('Product not found');
    process.exit(1);
  }

  // Update product to be digital
  product.isDigitalAvailable = true;
  product.priceDigital = 15;
  product.digitalFileUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
  await product.save();

  // Add to user library
  user.digitalLibrary.push({
    bookId: product._id,
    purchaseDate: new Date(),
    format: 'Digital'
  });

  await user.save();
  console.log('Seed successful! Check your dashboard.');
  process.exit(0);
}

seedDigitalBook();
