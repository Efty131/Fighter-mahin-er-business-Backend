const express = require('express');
const router = express.Router();
const { getMyEnrollments } = require('../controller/enrollmentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/myenrollments', protect, getMyEnrollments);

module.exports = router;
