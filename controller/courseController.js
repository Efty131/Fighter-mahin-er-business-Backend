const mongoose = require('mongoose');
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
    const courses = await Course.find({ status: 'published' })
      .populate('instructor', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch courses', error: error.message });
  }
};

const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    // Support lookup by MongoDB ObjectId OR slug
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { slug: id };

    const course = await Course.findOne(query).populate('instructor', 'name email');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.status(200).json(course);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch course', error: error.message });
  }
};

const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const { title, description, price } = req.body;
    if (title)       course.title       = title;
    if (description) course.description = description;
    if (price)       course.price       = price;

    // Replace thumbnail if a new one was uploaded
    if (req.files?.thumbnail?.[0]) {
      const result = await uploadImage(req.files.thumbnail[0], 'courses/thumbnails');
      course.thumbnail = { url: result.secureUrl, publicId: result.publicId };
    }

    // Append new videos if uploaded
    if (req.files?.videos?.length) {
      const uploads = await Promise.allSettled(
        req.files.videos.map((file) => uploadVideo(file, 'courses/videos'))
      );
      uploads.forEach((outcome, i) => {
        if (outcome.status === 'fulfilled') {
          const r = outcome.value;
          course.videos.push({
            url:      r.secureUrl,
            publicId: r.publicId,
            title:    req.body[`videoTitle_${i}`] || `Lecture ${course.videos.length + 1}`,
            duration: r.duration || 0,
          });
        }
      });
    }

    const updated = await course.save();
    res.status(200).json(updated);
  } catch (error) {
    console.error('updateCourse error:', error.message);
    res.status(500).json({ message: 'Failed to update course', error: error.message });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete course', error: error.message });
  }
};

module.exports = { createCourse, getCourses, getCourseById, updateCourse, deleteCourse };
