const News = require('../model/News');
const { uploadImage, deleteFromCloudinary } = require('../utils/cloudinaryUpload');

// ── Cloudinary folder for news (separate from articles/courses) ───────────────
const NEWS_IMAGE_FOLDER = 'news/images';

// ── Helpers ───────────────────────────────────────────────────────────────────
const sanitize = (str) => str.replace(/<[^>]*>/g, '').trim();

const toSlug = (text) =>
    text.toString().toLowerCase().trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

// ── Auto Tag Generator ────────────────────────────────────────────────────────
/**
 * Generates 2–3 tags from title, content, and category.
 *
 * Strategy:
 *  1. Title words are weighted 3×, content words 1×.
 *  2. Common Bangla stop words are filtered out.
 *  3. Words shorter than 2 chars are skipped.
 *  4. Top N words by weighted frequency are returned as tags.
 *  5. Category Bangla name is always prepended as the first tag.
 */
const BANGLA_STOP_WORDS = new Set([
    'এবং','ও','বা','কিন্তু','তবে','যে','যা','যেন','তাই','তাহলে','কারণ','যদি','তখন',
    'এই','সেই','ওই','এটি','সেটি','ওটি','এটা','সেটা','এখানে','সেখানে','ওখানে',
    'আমি','আমরা','তুমি','তোমরা','সে','তারা','তিনি','তাঁরা','আপনি','আপনারা',
    'হয়','হয়েছে','হবে','হলো','হচ্ছে','ছিল','ছিলেন','আছে','আছেন','ছিলো',
    'করে','করেছে','করবে','করলো','করছে','করা','করতে','করেন','করেছেন',
    'না','নয়','নেই','নি','নিয়ে','থেকে','পর্যন্ত','মধ্যে','ভেতরে','বাইরে',
    'আর','তার','তাদের','তাঁর','তাঁদের','এর','ওর','যার','কার','সব','সকল',
    'একটি','একটা','দুটি','দুটো','কিছু','অনেক','বেশি','কম','খুব','অত্যন্ত',
    'প্রতি','জন্য','সাথে','কাছে','উপর','নিচে','পাশে','দিকে','হিসেবে','মতো',
    'যখন','তখন','এখন','আগে','পরে','আজ','কাল','গতকাল','আবার','আরও','শুধু',
    'কি','কী','কেন','কীভাবে','কোথায়','কখন','কে','কাকে','কোন','কোনো',
    'দিয়ে','নিয়ে','বলে','গিয়ে','এসে','হয়ে','করে','দেখে','জানে','পেয়ে',
    'the','a','an','is','are','was','were','in','on','at','to','of','and','or',
]);

const autoGenerateTags = (title = '', content = '', categoryBn = '', count = 3) => {
    // Strip HTML from content
    const cleanContent = content.replace(/<[^>]*>/g, ' ');

    // Tokenise — split on whitespace and punctuation, keep Bangla + Latin words
    const tokenise = (text) =>
        text
            .replace(/[।,!?;:()[\]{}"'«»\-–—\/\\|@#$%^&*+=<>~`]/g, ' ')
            .split(/\s+/)
            .map((w) => w.trim())
            .filter((w) => w.length >= 2 && !BANGLA_STOP_WORDS.has(w));

    const titleTokens   = tokenise(title);
    const contentTokens = tokenise(cleanContent);

    // Build frequency map — title words weighted 3×
    const freq = new Map();
    for (const w of titleTokens) {
        freq.set(w, (freq.get(w) || 0) + 3);
    }
    for (const w of contentTokens) {
        freq.set(w, (freq.get(w) || 0) + 1);
    }

    // Sort by frequency descending, take top `count` words
    const topWords = [...freq.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, count)
        .map(([word]) => word);

    // Always include category Bangla name as first tag (if available and not duplicate)
    const tags = [];
    if (categoryBn && !topWords.includes(categoryBn)) {
        tags.push(categoryBn);
    }

    // Fill remaining slots from top words
    for (const w of topWords) {
        if (tags.length >= count) break;
        if (!tags.includes(w)) tags.push(w);
    }

    return tags.slice(0, count);
};

/**
 * Parse category from request body.
 * Accepts JSON string or plain object with { bn, en }.
 */
const parseCategory = (input) => {
    if (!input) return null;
    let cat = input;
    if (typeof cat === 'string') {
        try { cat = JSON.parse(cat); } catch { return null; }
    }
    if (!cat.bn || !cat.en) return null;
    return {
        bn:    sanitize(cat.bn),
        en:    sanitize(cat.en).toLowerCase(),
        slug:  toSlug(cat.en),
        class: `category-${toSlug(cat.en)}`,
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/news  — Admin: create news article (with optional cover image)
// ─────────────────────────────────────────────────────────────────────────────
const createNews = async (req, res) => {
    try {
        const { title, tags, content, status, category, source, sourceUrl, isFeatured } = req.body;

        if (!title) {
            return res.status(400).json({ success: false, message: 'title is required' });
        }

        // Parse tags — optional. If not provided, auto-generate from title + content.
        let parsedTags = [];
        if (tags) {
            // Admin provided tags manually — use them
            if (Array.isArray(tags)) {
                parsedTags = tags.map((t) => t.trim()).filter(Boolean);
            } else if (typeof tags === 'string') {
                try { parsedTags = JSON.parse(tags); } catch { parsedTags = tags.split(',').map((t) => t.trim()).filter(Boolean); }
            }
        }

        const parsedCategory = parseCategory(category);
        if (!parsedCategory) {
            return res.status(400).json({
                success: false,
                message: 'category is required with both bn (Bangla) and en (English) fields',
            });
        }

        // Auto-generate if none were provided (or array was empty)
        if (parsedTags.length === 0) {
            parsedTags = autoGenerateTags(title, content || '', parsedCategory.bn);
        }

        // Upload cover image to Cloudinary news folder if provided
        let coverImage = { url: '', publicId: '' };
        if (req.file) {
            const result = await uploadImage(req.file, NEWS_IMAGE_FOLDER);
            coverImage = { url: result.url, publicId: result.publicId };
        }

        const news = new News({
            title:      sanitize(title),
            tags:       parsedTags,
            content:    content ? sanitize(content) : '',
            status:     status || 'draft',
            category:   parsedCategory,
            coverImage,
            source:     source     ? sanitize(source)    : '',
            sourceUrl:  sourceUrl  ? sourceUrl.trim()    : '',
            isFeatured: isFeatured === 'true' || isFeatured === true,
            author:     req.user._id,
        });

        const saved = await news.save();
        res.status(201).json({ success: true, data: saved, message: 'News article created' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'Slug conflict — try a slightly different title' });
        }
        res.status(500).json({ success: false, message: 'Failed to create news', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/news  — Public: published news, paginated
// ?page, ?limit, ?category (slug/en/bn), ?search, ?featured
// ─────────────────────────────────────────────────────────────────────────────
const getNews = async (req, res) => {
    try {
        const page     = Math.max(1, parseInt(req.query.page)  || 1);
        const limit    = Math.min(50, parseInt(req.query.limit) || 10);
        const skip     = (page - 1) * limit;
        const category = req.query.category;
        const search   = req.query.search;
        const featured = req.query.featured;

        const filter = { status: 'published' };

        if (featured === 'true') filter.isFeatured = true;

        // Filter by category — slug, English, or Bangla
        if (category) {
            const term = category.trim().toLowerCase();
            filter.$or = [
                { 'category.slug': term },
                { 'category.en':   term },
                { 'category.bn':   category.trim() },
            ];
        }

        // Full-text search
        if (search) {
            const regex = { $regex: search, $options: 'i' };
            const searchConditions = [
                { title:           regex },
                { tags:            regex },
                { 'category.bn':   regex },
                { 'category.en':   regex },
            ];
            filter.$or = filter.$or
                ? [{ $and: [{ $or: filter.$or }, { $or: searchConditions }] }]
                : searchConditions;
        }

        const [articles, total] = await Promise.all([
            News.find(filter)
                .select('-content -__v')
                .populate('author', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            News.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            data: {
                articles,
                pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch news', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/news/categories  — Public: distinct news categories with counts
// ─────────────────────────────────────────────────────────────────────────────
const getNewsCategories = async (req, res) => {
    try {
        const categories = await News.aggregate([
            { $match: { status: 'published', category: { $exists: true } } },
            {
                $group: {
                    _id:   '$category.slug',
                    bn:    { $first: '$category.bn' },
                    en:    { $first: '$category.en' },
                    slug:  { $first: '$category.slug' },
                    class: { $first: '$category.class' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { bn: 1 } },
            {
                $project: {
                    _id:     0,
                    bn:      1,
                    en:      1,
                    slug:    1,
                    class:   1,
                    count:   1,
                    display: { $concat: ['$bn', ' (', '$en', ')'] },
                },
            },
        ]);

        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch categories', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/news/:slug  — Public: single published news article + increment views
// ─────────────────────────────────────────────────────────────────────────────
const getNewsBySlug = async (req, res) => {
    try {
        const news = await News.findOneAndUpdate(
            { slug: req.params.slug, status: 'published' },
            { $inc: { views: 1 } },
            { new: true }
        )
            .populate('author', 'name')
            .lean({ virtuals: true });

        if (!news) {
            return res.status(404).json({ success: false, message: 'News article not found' });
        }

        res.status(200).json({ success: true, data: news });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch news article', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/news/:id  — Admin: update news article
// ─────────────────────────────────────────────────────────────────────────────
const updateNews = async (req, res) => {
    try {
        const news = await News.findById(req.params.id);
        if (!news) {
            return res.status(404).json({ success: false, message: 'News article not found' });
        }

        const { title, tags, content, status, category, source, sourceUrl, isFeatured } = req.body;

        if (title)   news.title   = sanitize(title);
        if (content) news.content = sanitize(content);
        if (status)  news.status  = status;
        if (source)  news.source  = sanitize(source);
        if (sourceUrl) news.sourceUrl = sourceUrl.trim();
        if (isFeatured !== undefined) news.isFeatured = isFeatured === 'true' || isFeatured === true;

        // Tags: manual > auto-regenerate when title/content changed > keep existing
        if (tags !== undefined) {
            // Admin explicitly sent tags (even empty array = regenerate)
            let incoming = [];
            if (Array.isArray(tags)) {
                incoming = tags.map((t) => t.trim()).filter(Boolean);
            } else if (typeof tags === 'string') {
                try { incoming = JSON.parse(tags); } catch { incoming = tags.split(',').map((t) => t.trim()).filter(Boolean); }
            }

            if (incoming.length > 0) {
                // Use what admin provided
                news.tags = incoming;
            } else {
                // Empty array sent — regenerate from current (possibly updated) fields
                news.tags = autoGenerateTags(
                    news.title,
                    news.content || '',
                    news.category?.bn || ''
                );
            }
        } else if (title || content) {
            // No tags sent but title or content changed — regenerate automatically
            news.tags = autoGenerateTags(
                news.title,
                news.content || '',
                news.category?.bn || ''
            );
        }

        if (category) {
            const parsedCategory = parseCategory(category);
            if (!parsedCategory) {
                return res.status(400).json({
                    success: false,
                    message: 'category must include both bn (Bangla) and en (English) fields',
                });
            }
            news.category = parsedCategory;
        }

        // Replace cover image if a new file is uploaded
        if (req.file) {
            // Delete old image from Cloudinary
            if (news.coverImage?.publicId) {
                await deleteFromCloudinary(news.coverImage.publicId, 'image').catch(() => {});
            }
            const result = await uploadImage(req.file, NEWS_IMAGE_FOLDER);
            news.coverImage = { url: result.url, publicId: result.publicId };
        }

        const saved = await news.save();
        res.status(200).json({ success: true, data: saved, message: 'News article updated' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'Slug conflict — try a slightly different title' });
        }
        res.status(500).json({ success: false, message: 'Failed to update news', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/news/:id  — Admin: delete news + remove Cloudinary image
// ─────────────────────────────────────────────────────────────────────────────
const deleteNews = async (req, res) => {
    try {
        const news = await News.findByIdAndDelete(req.params.id);
        if (!news) {
            return res.status(404).json({ success: false, message: 'News article not found' });
        }

        // Clean up Cloudinary image
        if (news.coverImage?.publicId) {
            await deleteFromCloudinary(news.coverImage.publicId, 'image').catch(() => {});
        }

        res.status(200).json({ success: true, message: 'News article deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete news', error: error.message });
    }
};

module.exports = {
    createNews,
    getNews,
    getNewsCategories,
    getNewsBySlug,
    updateNews,
    deleteNews,
};
