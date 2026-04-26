const express = require('express');
const router  = express.Router();
const { createCourse, getCourses } = require('../controller/courseController');
const { protect, adminOnly }       = require('../middleware/authMiddleware');
const { uploadCourseFields }       = require('../middleware/uploadMiddleware');

router.get('/', getCourses);

router.post(
  '/',
  protect,
  adminOnly,
  uploadCourseFields,   // handles thumbnail + videos with type/size validation
  createCourse
);

module.exports = router;
