const mongoose = require('mongoose');
const { Schema } = mongoose;

const enrollmentSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true, // Tracks which order granted this access
    },
    enrolledAt: {
        type: Date,
        default: Date.now,
    },
});

// A user should only be enrolled in a specific course once
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
