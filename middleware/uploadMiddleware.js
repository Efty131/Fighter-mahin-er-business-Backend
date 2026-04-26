const multer = require('multer');

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
const ALL_TYPES   = [...IMAGE_TYPES, ...VIDEO_TYPES];

const MB = 1024 * 1024;

// Memory storage — buffers go straight to Cloudinary (no disk path)
const storage = multer.memoryStorage();

// ── File filter factories ──────────────────────────────────
function makeFilter(allowed) {
  return (req, file, cb) => {
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(
      Object.assign(
        new Error(`Invalid file type "${file.mimetype}". Allowed: ${allowed.join(', ')}`),
        { code: 'INVALID_FILE_TYPE', allowedTypes: allowed }
      ),
      false
    );
  };
}

// Per-field filter used by uploadCourseFields
function courseFieldFilter(req, file, cb) {
  if (file.fieldname === 'thumbnail') {
    if (IMAGE_TYPES.includes(file.mimetype)) return cb(null, true);
    return cb(
      Object.assign(
        new Error(`Thumbnail must be an image. Allowed: ${IMAGE_TYPES.join(', ')}`),
        { code: 'INVALID_FILE_TYPE', allowedTypes: IMAGE_TYPES }
      ),
      false
    );
  }
  if (file.fieldname === 'videos') {
    if (VIDEO_TYPES.includes(file.mimetype)) return cb(null, true);
    return cb(
      Object.assign(
        new Error(`Videos must be video files. Allowed: ${VIDEO_TYPES.join(', ')}`),
        { code: 'INVALID_FILE_TYPE', allowedTypes: VIDEO_TYPES }
      ),
      false
    );
  }
  // Unknown field — reject
  cb(Object.assign(new Error(`Unexpected field: ${file.fieldname}`), { code: 'LIMIT_UNEXPECTED_FILE' }), false);
}

// ── Multer instances ───────────────────────────────────────

/** Raw multer instance — exposes .fields(), .single(), .array() */
const upload = multer({
  storage,
  limits: { fileSize: 500 * MB }, // generous ceiling; per-field logic below
  fileFilter: makeFilter(ALL_TYPES),
});

/** Course-specific: thumbnail (image ≤10MB) + videos (video ≤500MB each) */
const uploadCourseFields = multer({
  storage,
  limits: { fileSize: 500 * MB },
  fileFilter: courseFieldFilter,
}).fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'videos',    maxCount: 10 },
]);

// ── Error-handling wrapper ─────────────────────────────────
function wrapMulter(multerFn) {
  return (req, res, next) => {
    multerFn(req, res, (err) => {
      if (!err) return next();
      return handleMulterError(err, res, next);
    });
  };
}

function handleMulterError(err, res, next) {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large', detail: err.message });
  }
  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({ message: err.message, allowedTypes: err.allowedTypes });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ message: `Unexpected field: ${err.field}` });
  }
  next(err);
}

module.exports = {
  // Raw instance — use when you need .fields() / .single() / .array() directly
  upload,

  // Pre-built wrapped middlewares for common routes
  uploadImage:        wrapMulter(multer({ storage, limits: { fileSize: 10 * MB }, fileFilter: makeFilter(IMAGE_TYPES) }).single('image')),
  uploadVideo:        wrapMulter(multer({ storage, limits: { fileSize: 500 * MB }, fileFilter: makeFilter(VIDEO_TYPES) }).single('video')),
  uploadMultiple:     wrapMulter(multer({ storage, limits: { fileSize: 500 * MB }, fileFilter: makeFilter(ALL_TYPES) }).array('files', 10)),
  uploadCourseFields: wrapMulter(uploadCourseFields),

  // Expose error handler for custom use
  handleMulterError,
};
