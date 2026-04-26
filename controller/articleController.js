const Article = require('../model/Article');

// ── Sanitize: strip HTML tags to prevent XSS ─────────────────────────────────
const sanitize = (str) => str.replace(/<[^>]*>/g, '').trim();

// ── Validate Substack URL ─────────────────────────────────────────────────────
const isValidSubstackUrl = (url) =>
    /^https:\/\/([\w-]+\.)?substack\.com\/.+/.test(url);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/articles  — Admin: create article
// ─────────────────────────────────────────────────────────────────────────────
const createArticle = async (req, res) => {
    try {
        const { title, excerpt, substackUrl, content, status } = req.body;

        if (!title || !excerpt || !substackUrl) {
            return res.status(400).json({
                success: false,
                message: 'title, excerpt, and substackUrl are required',
            });
        }
        if (!isValidSubstackUrl(substackUrl)) {
            return res.status(400).json({
                success: false,
                message: 'substackUrl must be a valid Substack URL (https://substack.com/...)',
            });
        }
        if (excerpt.length > 300) {
            return res.status(400).json({
                success: false,
                message: 'excerpt cannot exceed 300 characters',
            });
        }

        const article = new Article({
            title:       sanitize(title),
            excerpt:     sanitize(excerpt),
            substackUrl: substackUrl.trim(),
            content:     content ? sanitize(content) : '',
            status:      status || 'draft',
            author:      req.user._id,
        });

        const saved = await article.save();

        res.status(201).json({ success: true, data: saved, message: 'Article created' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'Slug conflict — try a slightly different title' });
        }
        res.status(500).json({ success: false, message: 'Failed to create article', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/articles  — Public: published articles, paginated
// ─────────────────────────────────────────────────────────────────────────────
const getArticles = async (req, res) => {
    try {
        const page  = Math.max(1, parseInt(req.query.page)  || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 10);
        const skip  = (page - 1) * limit;

        const [articles, total] = await Promise.all([
            Article.find({ status: 'published' })
                .select('-content -__v')
                .populate('author', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Article.countDocuments({ status: 'published' }),
        ]);

        res.status(200).json({
            success: true,
            data: {
                articles,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch articles', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/articles/:slug  — Public: single published article
// ─────────────────────────────────────────────────────────────────────────────
const getArticleBySlug = async (req, res) => {
    try {
        const article = await Article.findOne({ slug: req.params.slug, status: 'published' })
            .populate('author', 'name')
            .lean();

        if (!article) {
            return res.status(404).json({ success: false, message: 'Article not found' });
        }

        res.status(200).json({ success: true, data: article });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch article', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/articles/:id/like  — Auth: toggle like
// ─────────────────────────────────────────────────────────────────────────────
const toggleLike = async (req, res) => {
    try {
        const article = await Article.findById(req.params.id).select('likes');
        if (!article) {
            return res.status(404).json({ success: false, message: 'Article not found' });
        }

        const userId   = req.user._id;
        const hasLiked = article.likes.some((id) => id.equals(userId));

        const updated = await Article.findByIdAndUpdate(
            req.params.id,
            hasLiked
                ? { $pull:       { likes: userId } }
                : { $addToSet:   { likes: userId } },
            { new: true, select: 'likes' }
        );

        res.status(200).json({
            success: true,
            data:    { liked: !hasLiked, likeCount: updated.likes.length },
            message: hasLiked ? 'Like removed' : 'Article liked',
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to toggle like', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/articles/:id  — Admin: update article
// ─────────────────────────────────────────────────────────────────────────────
const updateArticle = async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        if (!article) {
            return res.status(404).json({ success: false, message: 'Article not found' });
        }

        const { title, excerpt, substackUrl, content, status } = req.body;

        if (substackUrl && !isValidSubstackUrl(substackUrl)) {
            return res.status(400).json({ success: false, message: 'Invalid Substack URL' });
        }
        if (excerpt && excerpt.length > 300) {
            return res.status(400).json({ success: false, message: 'Excerpt cannot exceed 300 characters' });
        }

        if (title)        article.title       = sanitize(title);   // slug auto-regenerates via pre-save
        if (excerpt)      article.excerpt     = sanitize(excerpt);
        if (substackUrl)  article.substackUrl = substackUrl.trim();
        if (content)      article.content     = sanitize(content);
        if (status)       article.status      = status;

        const saved = await article.save();

        res.status(200).json({ success: true, data: saved, message: 'Article updated' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'Slug conflict — try a slightly different title' });
        }
        res.status(500).json({ success: false, message: 'Failed to update article', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/articles/:id  — Admin: hard delete
// ─────────────────────────────────────────────────────────────────────────────
const deleteArticle = async (req, res) => {
    try {
        const article = await Article.findByIdAndDelete(req.params.id);
        if (!article) {
            return res.status(404).json({ success: false, message: 'Article not found' });
        }
        res.status(200).json({ success: true, message: 'Article deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete article', error: error.message });
    }
};

module.exports = {
    createArticle,
    getArticles,
    getArticleBySlug,
    toggleLike,
    updateArticle,
    deleteArticle,
};
