const Enrollment = require('../model/Enrollment');
const Progress = require('../model/Progress');

const getMyEnrollments = async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ user: req.user._id })
            .populate('course', 'title thumbnail')
            .lean(); 

        for (let i = 0; i < enrollments.length; i++) {
            const progress = await Progress.findOne({ enrollment: enrollments[i]._id });
            enrollments[i].progress = progress;
        }

        res.status(200).json(enrollments);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch enrollments', error: error.message });
    }
};

// Check if the logged-in user is enrolled in a specific course
const checkEnrollment = async (req, res) => {
    try {
        const enrollment = await Enrollment.findOne({
            user: req.user._id,
            course: req.params.courseId,
        });
        res.status(200).json({ enrolled: !!enrollment, enrollment: enrollment || null });
    } catch (error) {
        res.status(500).json({ message: 'Failed to check enrollment', error: error.message });
    }
};

// Manually enroll a user (e.g. after free course or admin grant)
const enrollInCourse = async (req, res) => {
    try {
        const { courseId, orderId } = req.body;
        if (!courseId || !orderId) {
            return res.status(400).json({ message: 'courseId and orderId are required' });
        }

        const existing = await Enrollment.findOne({ user: req.user._id, course: courseId });
        if (existing) return res.status(409).json({ message: 'Already enrolled in this course' });

        const enrollment = await Enrollment.create({
            user: req.user._id,
            course: courseId,
            order: orderId,
        });

        // Create a blank progress record
        await Progress.create({ enrollment: enrollment._id });

        res.status(201).json(enrollment);
    } catch (error) {
        res.status(500).json({ message: 'Failed to enroll', error: error.message });
    }
};

// Update video progress for an enrollment
const updateProgress = async (req, res) => {
    try {
        const { enrollmentId, videoUrl, isCompleted } = req.body;
        if (!enrollmentId || !videoUrl) {
            return res.status(400).json({ message: 'enrollmentId and videoUrl are required' });
        }

        // Verify the enrollment belongs to this user
        const enrollment = await Enrollment.findOne({ _id: enrollmentId, user: req.user._id });
        if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });

        let progress = await Progress.findOne({ enrollment: enrollmentId });
        if (!progress) {
            progress = await Progress.create({ enrollment: enrollmentId });
        }

        if (!progress.completedVideos.includes(videoUrl)) {
            progress.completedVideos.push(videoUrl);
        }
        progress.lastAccessed = new Date();
        if (isCompleted !== undefined) progress.isCompleted = isCompleted;

        await progress.save();
        res.status(200).json(progress);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update progress', error: error.message });
    }
};

module.exports = { getMyEnrollments, checkEnrollment, enrollInCourse, updateProgress };
