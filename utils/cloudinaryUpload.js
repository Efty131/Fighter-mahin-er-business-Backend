const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

const BASE_FOLDER = process.env.CLOUDINARY_UPLOAD_FOLDER || 'bigtime-lms';

// ── Convert buffer → readable stream ──────────────────────
function bufferToStream(buffer) {
  const readable = new Readable({ read() {} });
  readable.push(buffer);
  readable.push(null);
  return readable;
}

// ── Detect resource type from mimetype ────────────────────
function detectResourceType(mimetype = '') {
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('image/')) return 'image';
  return 'auto';
}

/**
 * Core upload — works with multer memory-storage buffers.
 * @param {Express.Multer.File} file  - req.file from multer
 * @param {string} folder             - sub-folder inside BASE_FOLDER
 * @param {object} options            - extra cloudinary upload options
 */
function uploadToCloudinary(file, folder = 'general', options = {}) {
  return new Promise((resolve, reject) => {
    const resourceType = detectResourceType(file.mimetype);
    const fullFolder   = `${BASE_FOLDER}/${folder}`;

    const uploadOptions = {
      folder:        fullFolder,
      resource_type: resourceType,
      use_filename:  true,
      unique_filename: true,
      ...options,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) return reject(new Error(`Cloudinary upload failed: ${error.message}`));
        resolve(result);
      }
    );

    bufferToStream(file.buffer).pipe(uploadStream);
  });
}

/**
 * Upload an image with auto format + quality optimisation.
 */
async function uploadImage(file, folder = 'images') {
  const result = await uploadToCloudinary(file, folder, {
    transformation: [{ fetch_format: 'auto', quality: 'auto' }],
    eager: [
      { width: 800, crop: 'limit', fetch_format: 'auto', quality: 'auto' }, // medium
      { width: 400, crop: 'limit', fetch_format: 'auto', quality: 'auto' }, // thumbnail
    ],
    eager_async: true,
  });

  return {
    url:          result.secure_url,
    publicId:     result.public_id,
    secureUrl:    result.secure_url,
    resourceType: result.resource_type,
    format:       result.format,
    width:        result.width,
    height:       result.height,
    bytes:        result.bytes,
  };
}

/**
 * Upload a video with streaming-ready eager transcodes.
 */
async function uploadVideo(file, folder = 'courses/videos') {
  const result = await uploadToCloudinary(file, folder, {
    resource_type: 'video',
    chunk_size:    6_000_000, // 6 MB chunks for large files
    eager: [
      { streaming_profile: 'hd',  format: 'm3u8' }, // HLS stream
      { streaming_profile: 'sd',  format: 'm3u8' },
      { width: 1280, height: 720, crop: 'limit', format: 'mp4', quality: 'auto' },
      { width: 640,  height: 360, crop: 'limit', format: 'mp4', quality: 'auto' },
    ],
    eager_async:        true,
    eager_notification_url: process.env.CLOUDINARY_WEBHOOK_URL || undefined,
  });

  return {
    url:          result.secure_url,
    publicId:     result.public_id,
    secureUrl:    result.secure_url,
    resourceType: result.resource_type,
    format:       result.format,
    duration:     result.duration   || null,
    bytes:        result.bytes,
    width:        result.width,
    height:       result.height,
  };
}

/**
 * Delete a file from Cloudinary by its public_id.
 * @param {string} publicId
 * @param {'image'|'video'|'auto'} resourceType
 */
async function deleteFromCloudinary(publicId, resourceType = 'image') {
  const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  if (result.result !== 'ok' && result.result !== 'not found') {
    throw new Error(`Cloudinary delete failed: ${result.result}`);
  }
  return result;
}

/**
 * Build an optimised Cloudinary URL with custom transformations.
 * @param {string} publicId
 * @param {object[]} transformations  - array of cloudinary transformation objects
 */
function getCloudinaryUrl(publicId, transformations = []) {
  return cloudinary.url(publicId, {
    secure:         true,
    transformation: [{ fetch_format: 'auto', quality: 'auto' }, ...transformations],
  });
}

module.exports = {
  uploadToCloudinary,
  uploadImage,
  uploadVideo,
  deleteFromCloudinary,
  getCloudinaryUrl,
};
