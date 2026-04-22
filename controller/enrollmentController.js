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

module.exports = { getMyEnrollments };
