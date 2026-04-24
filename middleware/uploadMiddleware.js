const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'online-academy',
    resource_type: 'auto', // Important for allowing both images and videos
    allowed_formats: ['jpg', 'png', 'jpeg', 'mp4', 'mkv', 'avi']
  }
});

const upload = multer({ storage: storage });

module.exports = upload;
