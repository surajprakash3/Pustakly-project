const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'pustakly_digital_books',
    resource_type: 'auto', // supports pdf, epub, etc.
    allowed_formats: ['pdf', 'epub', 'mobi', 'jpg', 'png'],
    access_mode: 'authenticated' // for security
  }
});

const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };
