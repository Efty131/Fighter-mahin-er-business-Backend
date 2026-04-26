const express = require('express');
const rateLimit = require('express-rate-limit');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { uploadImage, uploadVideo, uploadMultiple } = require('../middleware/uploadMiddleware');
const {
  uploadImage: cloudUploadImage,
  uploadVideo: cloudUploadVideo,
  uploadToCloudinary,
  deleteFromCloudinary,
} = require('../utils/cloudinaryUpload');

const router = express.Router();

// ── Rate limiter: 10 uploads / minute per IP ───────────────
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: 'Too many uploads. Please wait a minute and try again.' },
});

// All upload routes require auth + admin
router.use(protect, adminOnly, uploadLimiter);

// ── POST /api/upload/image ─────────────────────────────────
router.post('/image', uploadImage, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image file provided' });

    const folder = req.body.folder || 'products';
    const result = await cloudUploadImage(req.file, folder);

    res.status(201).json(result);
  } catch (err) {
    console.error('Image upload error:', err.message);
    res.status(500).json({ message: 'Image upload failed', error: err.message });
  }
});

// ── POST /api/upload/video ─────────────────────────────────
router.post('/video', uploadVideo, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No video file provided' });

    const folder = req.body.folder || 'courses/videos';
    const result = await cloudUploadVideo(req.file, folder);

    res.status(201).json(result);
  } catch (err) {
    console.error('Video upload error:', err.message);
    res.status(500).json({ message: 'Video upload failed', error: err.message });
  }
});

// ── POST /api/upload/multiple ──────────────────────────────
router.post('/multiple', uploadMultiple, async (req, res) => {
  try {
    if (!req.files?.length) return res.status(400).json({ message: 'No files provided' });

    const folder = req.body.folder || 'general';

    const uploads = await Promise.allSettled(
      req.files.map((file) => uploadToCloudinary(file, folder))
    );

    const results  = [];
    const failures = [];

    uploads.forEach((outcome, i) => {
      if (outcome.status === 'fulfilled') {
        const r = outcome.value;
        results.push({
          originalName: req.files[i].originalname,
          url:          r.secure_url,
          publicId:     r.public_id,
          secureUrl:    r.secure_url,
          resourceType: r.resource_type,
          format:       r.format,
          bytes:        r.bytes,
        });
      } else {
        failures.push({ originalName: req.files[i].originalname, error: outcome.reason.message });
      }
    });

    res.status(207).json({
      uploaded: results,
      failed:   failures,
      total:    req.files.length,
      success:  results.length,
    });
  } catch (err) {
    console.error('Multiple upload error:', err.message);
    res.status(500).json({ message: 'Multiple upload failed', error: err.message });
  }
});

// ── DELETE /api/upload/:publicId ───────────────────────────
router.delete('/:publicId(*)', async (req, res) => {
  try {
    const { publicId } = req.params;
    const resourceType = req.query.type || 'image'; // ?type=video

    await deleteFromCloudinary(publicId, resourceType);
    res.json({ message: 'File deleted successfully', publicId });
  } catch (err) {
    console.error('Delete error:', err.message);
    res.status(500).json({ message: 'Delete failed', error: err.message });
  }
});

module.exports = router;
