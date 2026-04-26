require('dotenv').config();
const cloudinary = require('cloudinary').v2;

console.log('🔍 Testing Cloudinary Connection');
console.log('================================');

// Show raw hex bytes to catch hidden characters (BOM, trailing spaces, etc.)
const cloudName  = process.env.CLOUDINARY_CLOUD_NAME  || '';
const apiKey     = process.env.CLOUDINARY_API_KEY     || '';
const apiSecret  = process.env.CLOUDINARY_API_SECRET  || '';

console.log('Credentials loaded from .env:');
console.log('  Cloud Name :', cloudName);
console.log('  API Key    :', apiKey);
console.log('  API Secret :', apiSecret.substring(0, 10) + '...');
console.log('');
console.log('Hex dump (reveals hidden chars like BOM or trailing spaces):');
console.log('  Cloud Name hex:', Buffer.from(cloudName).toString('hex'));
console.log('  API Key hex   :', Buffer.from(apiKey).toString('hex'));
console.log('');

// ── Method A: env vars ─────────────────────────────────────
async function testMethod(label, configFn) {
  configFn();
  console.log(`📡 ${label}: pinging...`);
  try {
    const result = await cloudinary.api.ping();
    console.log(`✅ ${label} PASSED — response:`, result);
    return true;
  } catch (err) {
    const msg = err?.message || err?.error?.message || JSON.stringify(err);
    console.error(`❌ ${label} FAILED — ${msg}`);
    return false;
  }
}

(async () => {
  // Method A — standard env vars
  const a = await testMethod('Method A (env vars)', () => {
    cloudinary.config({
      cloud_name: cloudName,
      api_key:    apiKey,
      api_secret: apiSecret,
      secure:     true,
    });
  });

  if (a) {
    console.log('\n🎉 Cloudinary is working. No changes needed.');
    process.exit(0);
  }

  // Method B — CLOUDINARY_URL string built from env vars
  const b = await testMethod('Method B (CLOUDINARY_URL from env)', () => {
    cloudinary.config({
      cloudinary_url: `cloudinary://${apiKey}:${apiSecret}@${cloudName}`,
    });
  });

  if (b) {
    console.log('\n✅ Method B works. Update config/cloudinary.js to use CLOUDINARY_URL format.');
    process.exit(0);
  }

  // Both failed — print actionable guidance
  console.error('\n⚠️  Both methods failed.');
  console.error('The most common cause of "cloud_name mismatch" is that the API Key');
  console.error('was copied from a DIFFERENT Cloudinary account/cloud.');
  console.error('');
  console.error('Fix steps:');
  console.error('  1. Open https://console.cloudinary.com');
  console.error('  2. Make sure you are logged into the account that owns cloud "dreyembuhy"');
  console.error('  3. Go to Settings → API Keys');
  console.error('  4. Copy the API Key and API Secret shown there');
  console.error('  5. Paste them into your .env file (replace current values)');
  console.error('  6. Run this script again: node scripts/test-cloudinary.js');
  process.exit(1);
})();
