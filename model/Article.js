const mongoose = require('mongoose');

// ── Helpers ───────────────────────────────────────────────────────────────────
const toSlug = (text) =>
    text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')   // remove special chars
        .replace(/\s+/g, '-')       // spaces → hyphens
        .replace(/-+/g, '-');       // collapse multiple hyphens

// ── Schema ────────────────────────────────────────────────────────────────────
const articleSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
        },
        excerpt: {
            type: String,
            required: [true, 'Excerpt is required'],
            maxlength: [300, 'Excerpt cannot exceed 300 characters'],
            trim: true,
        },
        substackUrl: {
            type: String,
            required: [true, 'Substack URL is required'],
            validate: {
                validator: (v) => /^https:\/\/([\w-]+\.)?substack\.com\/.+/.test(v),
                message: 'Must be a valid Substack URL (https://substack.com/...)',
            },
        },
        slug: {
            type: String,
            unique: true,
            index: true,
            trim: true,
            lowercase: true,
        },
        content: {
            type: String,
            default: '',
        },
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
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
    },
    { timestamps: true }
);

// ── Pre-save: auto-generate unique slug ───────────────────────────────────────
articleSchema.pre('save', async function (next) {
    // Only regenerate if title changed (or new doc)
    if (!this.isModified('title')) return next();

    const base = toSlug(this.title);
    let slug = base;
    let counter = 1;

    // Keep incrementing until slug is unique (excluding self)
    while (await mongoose.model('Article').exists({ slug, _id: { $ne: this._id } })) {
        slug = `${base}-${counter++}`;
    }

    this.slug = slug;
    next();
});

module.exports = mongoose.model('Article', articleSchema);
