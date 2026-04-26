const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// ── Validate required env vars on startup ──────────────────
const required = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`❌ Missing Cloudinary env vars: ${missing.join(', ')}`.red);
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true, // always return https URLs
});

// Quick connectivity check (non-blocking)
cloudinary.api.ping()
  .then(() => console.log('☁️  Cloudinary connected successfully'.green))
  .catch((err) => console.error(`⚠️  Cloudinary ping failed: ${err.message}`.yellow));

module.exports = cloudinary;
