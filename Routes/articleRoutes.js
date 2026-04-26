const express = require('express');
const router  = express.Router();
const {
    createArticle,
    getArticles,
    getArticleBySlug,
    toggleLike,
    updateArticle,
    deleteArticle,
} = require('../controller/articleController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ── Simple in-memory rate limiter: 3 like requests / min per user ─────────────
const likeHits = new Map(); // userId → [timestamps]

const likeLimiter = (req, res, next) => {
    const userId = req.user._id.toString();
    const now    = Date.now();
    const window = 60 * 1000; // 1 minute
    const max    = 3;

    const hits = (likeHits.get(userId) || []).filter((t) => now - t < window);
    if (hits.length >= max) {
        return res.status(429).json({
            success: false,
            message: 'Too many like requests — wait a minute and try again',
        });
    }
    hits.push(now);
    likeHits.set(userId, hits);
    next();
};

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/',          getArticles);        // paginated published list
router.get('/:slug',     getArticleBySlug);   // single article by slug  ← before /:id

// ── Authenticated users ───────────────────────────────────────────────────────
router.post('/:id/like', protect, likeLimiter, toggleLike);

// ── Admin only ────────────────────────────────────────────────────────────────
router.post('/',         protect, adminOnly, createArticle);
router.put('/:id',       protect, adminOnly, updateArticle);
router.delete('/:id',    protect, adminOnly, deleteArticle);

module.exports = router;
