require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function checkCloudinary() {
  console.log('--- Cloudinary Status Check ---');
  console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
  
  if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'your_cloud_name') {
    console.log('❌ Error: Cloudinary credentials not set in .env');
    return;
  }

  try {
    const result = await cloudinary.api.ping();
    console.log('✅ Connection: Successful');
    console.log('Response:', result);
  } catch (error) {
    console.log('❌ Connection: Failed');
    console.log('Error Details:', error.message);
    if (error.message.includes('Must supply cloud_name')) {
        console.log('Suggestion: Ensure CLOUDINARY_CLOUD_NAME is correct.');
    }
  }
}

checkCloudinary();
