const express = require('express');
const router = express.Router();
const { createCourse, getCourses } = require('../controller/courseController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', getCourses);
router.post(
  '/', 
  protect, 
  adminOnly, 
  upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'videos', maxCount: 10 }]),
  createCourse
);

module.exports = router;
