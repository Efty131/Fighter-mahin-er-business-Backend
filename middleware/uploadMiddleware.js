const multer = require('multer');

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
const ALL_TYPES   = [...IMAGE_TYPES, ...VIDEO_TYPES];

const MB = 1024 * 1024;

// ── Memory storage — buffers go straight to Cloudinary ────
const storage = multer.memoryStorage();

// ── Generic file filter factory ────────────────────────────
function makeFilter(allowed) {
  return (req, file, cb) => {
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        Object.assign(new Error(`Invalid file type: ${file.mimetype}. Allowed: ${allowed.join(', ')}`), {
          code: 'INVALID_FILE_TYPE',
          allowedTypes: allowed,
        }),
        false
      );
    }
  };
}

// ── Multer instances ───────────────────────────────────────

/** Single image upload — max 10 MB */
const uploadImage = multer({
  storage,
  limits: { fileSize: 10 * MB },
  fileFilter: makeFilter(IMAGE_TYPES),
}).single('image');

/** Single video upload — max 500 MB */
const uploadVideo = multer({
  storage,
  limits: { fileSize: 500 * MB },
  fileFilter: makeFilter(VIDEO_TYPES),
}).single('video');

/** Multiple mixed files — max 10 files, 500 MB each */
const uploadMultiple = multer({
  storage,
  limits: { fileSize: 500 * MB },
  fileFilter: makeFilter(ALL_TYPES),
}).array('files', 10);

// ── Error-handling wrappers ────────────────────────────────
function wrapMulter(multerFn) {
  return (req, res, next) => {
    multerFn(req, res, (err) => {
      if (!err) return next();

      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          message: 'File too large',
          maxSize: err.field === 'video' ? '500MB' : '10MB',
        });
      }
      if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
          message: err.message,
          allowedTypes: err.allowedTypes,
        });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ message: 'Unexpected field name in form data' });
      }

      next(err);
    });
  };
}

module.exports = {
  uploadImage:    wrapMulter(uploadImage),
  uploadVideo:    wrapMulter(uploadVideo),
  uploadMultiple: wrapMulter(uploadMultiple),
};
