const mongoose = require('mongoose');

// ── Helpers ───────────────────────────────────────────────────────────────────
const toSlug = (text) =>
    text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

// ── Category Sub-Schema (same dual-language structure as Article) ─────────────
const categorySchema = new mongoose.Schema(
    {
        bn:   { type: String, required: [true, 'Bangla category name is required'], trim: true },
        en:   { type: String, required: [true, 'English category name is required'], trim: true, lowercase: true },
        slug: { type: String, required: true, lowercase: true, index: true },
        class: {
            type: String,
            default: function () {
                return `category-${this.en?.replace(/[^a-z0-9]/g, '-')}`;
            },
        },
    },
    { _id: false }
);

// ── News Schema ───────────────────────────────────────────────────────────────
const newsSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
        },
        excerpt: {
            type: String,
            required: [true, 'Excerpt is required'],
            maxlength: [500, 'Excerpt cannot exceed 500 characters'],
            trim: true,
        },
        content: {
            type: String,
            default: '',
        },
        slug: {
            type: String,
            unique: true,
            index: true,
            trim: true,
            lowercase: true,
        },
        category: {
            type: categorySchema,
            required: [true, 'Category is required'],
        },
        // News-specific: cover image stored in Cloudinary under bigtime-news/images/
        coverImage: {
            url:      { type: String, default: '' },
            publicId: { type: String, default: '' },
        },
        source: {
            type: String,
            trim: true,
            default: '',
        },
        sourceUrl: {
            type: String,
            trim: true,
            default: '',
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: ['draft', 'published'],
            default: 'draft',
            index: true,
        },
        views: {
            type: Number,
            default: 0,
        },
        isFeatured: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    {
        timestamps: true,
        toJSON:     { virtuals: true },
        toObject:   { virtuals: true },
        collection: 'news', // explicit collection name — separate from 'articles'
    }
);

// ── Virtuals ──────────────────────────────────────────────────────────────────
newsSchema.virtual('categoryDisplay').get(function () {
    if (!this.category) return '';
    return `${this.category.bn} (${this.category.en})`;
});

newsSchema.virtual('categoryKeywords').get(function () {
    if (!this.category) return [];
    return [
        this.category.bn.toLowerCase(),
        this.category.en.toLowerCase(),
        this.category.slug,
    ];
});

// ── Indexes ───────────────────────────────────────────────────────────────────
newsSchema.index({ 'category.bn': 'text', 'category.en': 'text', title: 'text', excerpt: 'text' });
newsSchema.index({ isFeatured: 1, status: 1, createdAt: -1 });

// ── Pre-save: auto-generate unique slug from title ────────────────────────────
newsSchema.pre('save', async function (next) {
    if (!this.isModified('title')) return next();

    const base = toSlug(this.title);
    let slug = base;
    let counter = 1;

    while (await mongoose.model('News').exists({ slug, _id: { $ne: this._id } })) {
        slug = `${base}-${counter++}`;
    }

    this.slug = slug;
    next();
});

// ── Pre-save: auto-generate category slug from English name ───────────────────
newsSchema.pre('save', function (next) {
    if (this.category && this.isModified('category.en')) {
        this.category.slug = toSlug(this.category.en);
    }
    next();
});

module.exports = mongoose.model('News', newsSchema);
