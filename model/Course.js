const mongoose = require('mongoose');
const { Schema } = mongoose;

const courseSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    thumbnail: {
        url:      { type: String, default: '' },
        publicId: { type: String, default: '' },
    },
    videos: [
        {
            url:      { type: String, required: true },
            publicId: { type: String, required: true },
            title:    { type: String, default: '' },
            duration: { type: Number, default: 0 }, // seconds
        },
    ],
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Course', courseSchema);
