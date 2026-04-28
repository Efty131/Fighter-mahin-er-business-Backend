const mongoose = require('mongoose');
const Course = require('../model/Course');
const { uploadImage, uploadVideo, deleteFromCloudinary } = require('../utils/cloudinaryUpload');

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function buildQuery(id) {
  return mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { slug: id };
}

// ─────────────────────────────────────────────────────────────
// PUBLIC ENDPOINTS
// ─────────────────────────────────────────────────────────────

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
    const course = await Course.findOne(buildQuery(req.params.id))
      .populate('instructor', 'name email');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.status(200).json(course);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch course', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN — COURSE CRUD
// ─────────────────────────────────────────────────────────────

const createCourse = async (req, res) => {
  try {
    const { title, description, price, category, level, status, slug } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'title and description are required' });
    }

    let thumbnail = { url: '', publicId: '' };
    if (req.files?.thumbnail?.[0]) {
      const result = await uploadImage(req.files.thumbnail[0], 'courses/thumbnails');
      thumbnail = { url: result.secureUrl, publicId: result.publicId };
    }

    let videos = [];
    if (req.files?.videos?.length) {
      const uploads = await Promise.allSettled(
        req.files.videos.map((file) => uploadVideo(file, 'courses/videos'))
      );
      uploads.forEach((outcome, i) => {
        if (outcome.status === 'fulfilled') {
          const r = outcome.value;
          videos.push({
            url:         r.secureUrl,
            publicId:    r.publicId,
            title:       req.body[`videoTitle_${i}`]       || `Video ${i + 1}`,
            description: req.body[`videoDescription_${i}`] || '',
            duration:    r.duration || 0,
            order:       i,
            isFree:      req.body[`videoIsFree_${i}`] === 'true',
          });
        } else {
          console.error(`Video ${i} upload failed:`, outcome.reason.message);
        }
      });
    }

    const course = await Course.create({
      title, description,
      price:    price    || 0,
      category: category || 'General',
      level:    level    || 'Beginner',
      status:   status   || 'published',
      slug:     slug     || undefined,
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

const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const fields = ['title', 'description', 'price', 'category', 'level', 'status', 'slug'];
    fields.forEach((f) => { if (req.body[f] !== undefined) course[f] = req.body[f]; });

    if (req.files?.thumbnail?.[0]) {
      // Delete old thumbnail from Cloudinary if it exists
      if (course.thumbnail?.publicId) {
        await deleteFromCloudinary(course.thumbnail.publicId, 'image').catch(() => {});
      }
      const result = await uploadImage(req.files.thumbnail[0], 'courses/thumbnails');
      course.thumbnail = { url: result.secureUrl, publicId: result.publicId };
    }

    // Append new videos (use addVideo endpoint to manage individually)
    if (req.files?.videos?.length) {
      const uploads = await Promise.allSettled(
        req.files.videos.map((file) => uploadVideo(file, 'courses/videos'))
      );
      uploads.forEach((outcome, i) => {
        if (outcome.status === 'fulfilled') {
          const r = outcome.value;
          const nextOrder = course.videos.length;
          course.videos.push({
            url:         r.secureUrl,
            publicId:    r.publicId,
            title:       req.body[`videoTitle_${i}`]       || `Video ${nextOrder + 1}`,
            description: req.body[`videoDescription_${i}`] || '',
            duration:    r.duration || 0,
            order:       nextOrder,
            isFree:      req.body[`videoIsFree_${i}`] === 'true',
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
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Clean up Cloudinary assets
    const deletions = [];
    if (course.thumbnail?.publicId) {
      deletions.push(deleteFromCloudinary(course.thumbnail.publicId, 'image'));
    }
    course.videos.forEach((v) => {
      if (v.publicId) deletions.push(deleteFromCloudinary(v.publicId, 'video'));
      if (v.customThumbnail?.publicId) deletions.push(deleteFromCloudinary(v.customThumbnail.publicId, 'image'));
    });
    await Promise.allSettled(deletions); // don't block deletion if Cloudinary fails

    await course.deleteOne();
    res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete course', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN — VIDEO MANAGEMENT
// ─────────────────────────────────────────────────────────────

/** POST /api/courses/:id/videos — upload a single new video to an existing course */
const addVideo = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (!req.files?.videos?.[0]) {
      return res.status(400).json({ message: 'No video file provided' });
    }

    const r = await uploadVideo(req.files.videos[0], 'courses/videos');
    const nextOrder = course.videos.length;

    const newVideo = {
      url:         r.secureUrl,
      publicId:    r.publicId,
      title:       req.body.title       || `Video ${nextOrder + 1}`,
      description: req.body.description || '',
      duration:    r.duration || 0,
      order:       req.body.order !== undefined ? Number(req.body.order) : nextOrder,
      isFree:      req.body.isFree === 'true',
      isPublished: req.body.isPublished !== 'false',
    };

    course.videos.push(newVideo);
    await course.save();

    res.status(201).json(course.videos[course.videos.length - 1]);
  } catch (error) {
    console.error('addVideo error:', error.message);
    res.status(500).json({ message: 'Failed to add video', error: error.message });
  }
};

/** PATCH /api/courses/:id/videos/:videoId — update metadata + optional custom thumbnail */
const updateVideo = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const video = course.videos.id(req.params.videoId);
    if (!video) return res.status(404).json({ message: 'Video not found' });

    // Update text metadata
    const metaFields = ['title', 'description', 'order', 'isFree', 'isPublished'];
    metaFields.forEach((f) => {
      if (req.body[f] !== undefined) {
        if (f === 'isFree' || f === 'isPublished') video[f] = req.body[f] === 'true' || req.body[f] === true;
        else if (f === 'order') video[f] = Number(req.body[f]);
        else video[f] = req.body[f];
      }
    });

    // Upload new custom thumbnail if provided
    if (req.files?.thumbnail?.[0]) {
      if (video.customThumbnail?.publicId) {
        await deleteFromCloudinary(video.customThumbnail.publicId, 'image').catch(() => {});
      }
      const result = await uploadImage(req.files.thumbnail[0], 'courses/video-thumbnails');
      video.customThumbnail = { url: result.secureUrl, publicId: result.publicId };
    }

    await course.save();
    res.status(200).json(video);
  } catch (error) {
    console.error('updateVideo error:', error.message);
    res.status(500).json({ message: 'Failed to update video', error: error.message });
  }
};

/** DELETE /api/courses/:id/videos/:videoId — remove a video from a course */
const deleteVideo = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const video = course.videos.id(req.params.videoId);
    if (!video) return res.status(404).json({ message: 'Video not found' });

    // Delete from Cloudinary
    const deletions = [deleteFromCloudinary(video.publicId, 'video')];
    if (video.customThumbnail?.publicId) {
      deletions.push(deleteFromCloudinary(video.customThumbnail.publicId, 'image'));
    }
    await Promise.allSettled(deletions);

    video.deleteOne();
    await course.save();

    res.status(200).json({ message: 'Video deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete video', error: error.message });
  }
};

/** PATCH /api/courses/:id/videos/reorder — bulk reorder videos */
const reorderVideos = async (req, res) => {
  try {
    // Body: { order: [{ videoId, order }, ...] }
    const { order } = req.body;
    if (!Array.isArray(order)) {
      return res.status(400).json({ message: 'order must be an array of { videoId, order }' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    order.forEach(({ videoId, order: newOrder }) => {
      const video = course.videos.id(videoId);
      if (video) video.order = newOrder;
    });

    // Sort the array in-place so the stored order matches
    course.videos.sort((a, b) => a.order - b.order);
    await course.save();

    res.status(200).json(course.videos);
  } catch (error) {
    res.status(500).json({ message: 'Failed to reorder videos', error: error.message });
  }
};

module.exports = {
  // Public
  getCourses,
  getCourseById,
  // Course CRUD
  createCourse,
  updateCourse,
  deleteCourse,
  // Video management
  addVideo,
  updateVideo,
  deleteVideo,
  reorderVideos,
};
