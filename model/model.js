const mongoose = require('mongoose');
const { Schema } = mongoose;

const productSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0, // Price can't be negative
    },
    slug: {
        type: String,
        unique: true, // Each slug must be unique
        trim: true,
        lowercase: true,
    },
    images: {
        type: [
            {
                url:      { type: String, required: true },
                publicId: { type: String, default: '' },
                alt:      { type: String, default: '' },
            },
        ],
        validate: {
            validator: (v) => v.length > 0,
            message: 'At least one image is required',
        },
        required: true,
    },
    thumbnail: {
        url:      { type: String, default: '' },
        publicId: { type: String, default: '' },
    },
    category: {
        type: String,
        required: true,
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Auto-generate slug from name before saving
productSchema.pre('save', function(next) {
    if (this.isModified('name')) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // Remove special chars
            .replace(/\s+/g, '-');    // Replace spaces with hyphens
        
        // Add random number to ensure uniqueness
        this.slug += '-' + Math.random().toString(36).substring(2, 7);
    }
    next();
});

module.exports = mongoose.model('Product', productSchema);