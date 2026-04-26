// dotenv is already loaded by index.js before this file is required.
// Do NOT call require('dotenv').config() here — it would be a no-op
// on Render/Railway where env vars come from the platform, not a .env file.

const cloudinary = require('cloudinary').v2;

// ── Validate credentials before attempting to configure ───
const REQUIRED = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missing  = REQUIRED.filter((k) => !process.env[k]);

if (missing.length) {
  console.error('❌ Cloudinary credentials missing:', missing.join(', '));
  console.error('   Add them to your .env file (local) or platform env vars (Render/Railway).');
  console.error('   Get your keys at: https://console.cloudinary.com → Settings → API Keys');
  process.exit(1);
}

// ── Diagnostic logging ─────────────────────────────────────
console.log('🔍 CLOUDINARY DEBUG INFO:');
console.log('  Cloud Name from .env:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('  API Key from .env:', process.env.CLOUDINARY_API_KEY);
console.log('  API Secret length:', process.env.CLOUDINARY_API_SECRET?.length || 0);
console.log('  API Secret first 5 chars:', process.env.CLOUDINARY_API_SECRET?.substring(0, 5));
console.log('  Upload Folder:', process.env.CLOUDINARY_UPLOAD_FOLDER);
// Check for hidden characters (BOM, spaces, etc.)
console.log('  Cloud Name bytes (hex):', Buffer.from(process.env.CLOUDINARY_CLOUD_NAME || '').toString('hex'));
console.log('  API Key bytes (hex):', Buffer.from(process.env.CLOUDINARY_API_KEY || '').toString('hex'));

// ── Method A: Standard config ──────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

// ── Non-blocking connectivity check ───────────────────────
cloudinary.api.ping()
  .then((result) => {
    console.log('☁️  Cloudinary connected!');
    console.log(`   Cloud: ${process.env.CLOUDINARY_CLOUD_NAME}  |  Folder: ${process.env.CLOUDINARY_UPLOAD_FOLDER || 'bigtime-lms'}`);
    console.log('   Ping response:', JSON.stringify(result));
  })
  .catch((err) => {
    const detail = err?.message || err?.error?.message || JSON.stringify(err);
    console.error('❌ Cloudinary ping failed:', detail);
    console.error('   Error code:', err?.error?.code);
    console.error('   HTTP status:', err?.error?.http_code || err?.http_code);
    console.error('   Full error:', JSON.stringify(err));

    if (detail.includes('cloud_name mismatch')) {
      console.error('');
      console.error('🔧 DIAGNOSIS: API Key does NOT belong to this cloud account.');
      console.error('   The API Key 279435828834246 was issued for a DIFFERENT cloud name.');
      console.error('   Fix: Go to https://console.cloudinary.com/dreyembuhy/settings/api-keys');
      console.error('   and copy the API Key + Secret that are listed there (not from another account).');
      console.error('');
      console.error('   Falling back to CLOUDINARY_URL method...');

      // ── Method B: CLOUDINARY_URL fallback ─────────────────
      const cloudinaryUrl = `cloudinary://${process.env.CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}@${process.env.CLOUDINARY_CLOUD_NAME}`;
      cloudinary.config({ cloudinary_url: cloudinaryUrl });

      cloudinary.api.ping()
        .then((r) => console.log('✅ Method B (CLOUDINARY_URL) succeeded:', JSON.stringify(r)))
        .catch((e) => {
          console.error('❌ Method B also failed:', e?.message || JSON.stringify(e));
          console.error('');
          console.error('   ⚠️  Both methods failed. The credentials in .env do not match cloud "dreyembuhy".');
          console.error('   Run: node scripts/test-cloudinary.js  for a full diagnostic.');
        });
    }
  });

module.exports = cloudinary;
