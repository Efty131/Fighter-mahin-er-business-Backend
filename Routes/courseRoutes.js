const express = require('express');
const router = express.Router();
const { createCourse, getCourses } = require('../controller/courseController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', getCourses);
router.post('/', protect, adminOnly, createCourse);

module.exports = router;
