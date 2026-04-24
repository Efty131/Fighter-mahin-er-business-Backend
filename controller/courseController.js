const Course = require('../model/Course');

const createCourse = async (req, res) => {
    try {
        let { title, description, price, thumbnail, videoUrls } = req.body;
        
        if (req.files) {
            if (req.files.thumbnail && req.files.thumbnail.length > 0) {
                thumbnail = req.files.thumbnail[0].path;
            }
            if (req.files.videos && req.files.videos.length > 0) {
                const uploadedVideoUrls = req.files.videos.map(file => file.path);
                if (videoUrls && Array.isArray(videoUrls)) {
                    videoUrls = [...videoUrls, ...uploadedVideoUrls];
                } else if (typeof videoUrls === 'string') {
                    videoUrls = [videoUrls, ...uploadedVideoUrls];
                } else {
                    videoUrls = uploadedVideoUrls;
                }
            }
        }
        
        const course = new Course({
            title,
            description,
            price,
            thumbnail,
            videoUrls: videoUrls || [],
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
