const Course = require('../model/Course');
const { uploadImage, uploadVideo } = require('../utils/cloudinaryUpload');

const createCourse = async (req, res) => {
  try {
    const { title, description, price } = req.body;

    if (!title || !description || !price) {
      return res.status(400).json({ message: 'title, description, and price are required' });
    }

    // ── Upload thumbnail ───────────────────────────────────
    let thumbnail = { url: '', publicId: '' };
    if (req.files?.thumbnail?.[0]) {
      const result = await uploadImage(req.files.thumbnail[0], 'courses/thumbnails');
      thumbnail = { url: result.secureUrl, publicId: result.publicId };
    }

    // ── Upload videos ──────────────────────────────────────
    let videos = [];
    if (req.files?.videos?.length) {
      const uploads = await Promise.allSettled(
        req.files.videos.map((file) => uploadVideo(file, 'courses/videos'))
      );

      uploads.forEach((outcome, i) => {
        if (outcome.status === 'fulfilled') {
          const r = outcome.value;
          videos.push({
            url:      r.secureUrl,
            publicId: r.publicId,
            title:    req.body[`videoTitle_${i}`] || `Lecture ${i + 1}`,
            duration: r.duration || 0,
          });
        } else {
          console.error(`Video ${i} upload failed:`, outcome.reason.message);
        }
      });
    }

    const course = await Course.create({
      title,
      description,
      price,
      thumbnail,
      videos,
      instructor: req.user._id,
    });

    res.status(201).json(course);
  } catch (error) {
    console.error('createCourse error:', error.message);
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
