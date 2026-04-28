const express = require('express');
const router  = express.Router();
const { createCourse, getCourses, getCourseById, updateCourse, deleteCourse } = require('../controller/courseController');
const { protect, adminOnly }       = require('../middleware/authMiddleware');
const { uploadCourseFields }       = require('../middleware/uploadMiddleware');

// Public routes
router.get('/', getCourses);
router.get('/:id', getCourseById);

// Admin-only routes
router.post('/', protect, adminOnly, uploadCourseFields, createCourse);
router.put('/:id', protect, adminOnly, uploadCourseFields, updateCourse);
router.delete('/:id', protect, adminOnly, deleteCourse);

module.exports = router;
