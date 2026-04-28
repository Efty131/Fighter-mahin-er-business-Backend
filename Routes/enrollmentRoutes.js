const express = require('express');
const router = express.Router();
const { getMyEnrollments, checkEnrollment, enrollInCourse, updateProgress } = require('../controller/enrollmentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/myenrollments', protect, getMyEnrollments);
router.get('/check/:courseId', protect, checkEnrollment);
router.post('/', protect, enrollInCourse);
router.patch('/progress', protect, updateProgress);

module.exports = router;
