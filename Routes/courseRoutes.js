const express = require('express');
const router  = express.Router();
const {
  getCourses, getCourseById,
  createCourse, updateCourse, deleteCourse,
  addVideo, updateVideo, deleteVideo, reorderVideos,
} = require('../controller/courseController');
const { protect, adminOnly }     = require('../middleware/authMiddleware');
const { uploadCourseFields }     = require('../middleware/uploadMiddleware');

// ── Public ────────────────────────────────────────────────
router.get('/',    getCourses);
router.get('/:id', getCourseById);

// ── Admin — course CRUD ───────────────────────────────────
router.post(  '/',    protect, adminOnly, uploadCourseFields, createCourse);
router.put(   '/:id', protect, adminOnly, uploadCourseFields, updateCourse);
router.delete('/:id', protect, adminOnly, deleteCourse);

// ── Admin — video management ──────────────────────────────
router.post(  '/:id/videos',                protect, adminOnly, uploadCourseFields, addVideo);
router.patch( '/:id/videos/reorder',        protect, adminOnly, reorderVideos);
router.patch( '/:id/videos/:videoId',       protect, adminOnly, uploadCourseFields, updateVideo);
router.delete('/:id/videos/:videoId',       protect, adminOnly, deleteVideo);

module.exports = router;
