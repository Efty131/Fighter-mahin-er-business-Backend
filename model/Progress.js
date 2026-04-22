const mongoose = require('mongoose');
const { Schema } = mongoose;

const progressSchema = new Schema({
    enrollment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Enrollment',
        required: true,
        unique: true, // 1:1 relationship with Enrollment
    },
    completedVideos: {
        type: [String], // Array of video URLs or indices that have been watched completely
        default: [],
    },
    isCompleted: {
        type: Boolean,
        default: false,
    },
    lastAccessed: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Progress', progressSchema);
