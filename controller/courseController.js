const Course = require('../model/Course');

const createCourse = async (req, res) => {
    try {
        const { title, description, price, thumbnail, videoUrls } = req.body;
        
        const course = new Course({
            title,
            description,
            price,
            thumbnail,
            videoUrls,
            instructor: req.user._id 
        });

        const createdCourse = await course.save();
        res.status(201).json(createdCourse);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create course', error: error.message });
    }
};

const getCourses = async (req, res) => {
    try {
        const courses = await Course.find({}).populate('instructor', 'name email');
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch courses', error: error.message });
    }
};

module.exports = { createCourse, getCourses };
