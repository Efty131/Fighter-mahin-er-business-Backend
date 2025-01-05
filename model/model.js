const mongoose = require('mongoose');
const { Schema } = mongoose;

const productSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true, // Remove whitespace around the name
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    images: {
        type: [String], // Array of image URLs
        validate: {
            validator: function (value) {
                return value.length > 0; // Ensure at least one image URL is provided
            },
            message: 'At least one image URL is required',
        },
        required: true, // The field itself is required
    },
    category: {
        type: String,
        required: true,
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now, // Automatically set creation date
    },
});

module.exports = mongoose.model('Product', productSchema);