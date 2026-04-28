const express = require('express');
const router  = express.Router();
const {
    createNews,
    getNews,
    getNewsCategories,
    getNewsBySlug,
    updateNews,
    deleteNews,
} = require('../controller/newsController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { uploadImage } = require('../middleware/uploadMiddleware');

// ── Public ────────────────────────────────────────────────────────────────────
// GET /api/news                          — paginated published news
//   ?page=1 &limit=10
//   ?category=politics                   — filter by slug or English name
//   ?category=রাজনীতি                    — filter by Bangla name
//   ?search=keyword                      — search title, excerpt, category
//   ?featured=true                       — featured news only
router.get('/',           getNews);

// GET /api/news/categories               — all distinct categories with counts
router.get('/categories', getNewsCategories);   // ← must be before /:slug

// GET /api/news/:slug                    — single news article by slug (increments views)
router.get('/:slug',      getNewsBySlug);

// ── Admin only ────────────────────────────────────────────────────────────────
// POST /api/news                         — create (multipart/form-data, field: image)
router.post('/',          protect, adminOnly, uploadImage, createNews);

// PUT /api/news/:id                      — update (optionally replace cover image)
router.put('/:id',        protect, adminOnly, uploadImage, updateNews);

// DELETE /api/news/:id                   — delete news + Cloudinary image
router.delete('/:id',     protect, adminOnly, deleteNews);

module.exports = router;
