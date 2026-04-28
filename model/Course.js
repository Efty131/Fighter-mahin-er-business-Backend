const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema(
  {
    title:    { type: String, default: '', trim: true },
    publicId: { type: String, required: true },
    url:      { type: String, required: true }, // Cloudinary URL
    duration: { type: Number, default: 0 },     // seconds
    order:    { type: Number, default: 0 },
  },
  { _id: true }
);

const courseSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price:       { type: Number, default: 0, min: 0 },
    category:    { type: String, default: 'General' },
    level:       { type: String, default: 'Beginner' },
    thumbnail: {
      url:      { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    videos: [videoSchema],
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
      required: true,
    },
    status: {
      type:    String,
      enum:    ['draft', 'published'],
      default: 'published',
    },
    slug: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

courseSchema.index({ status: 1 });
courseSchema.index({ slug: 1 });

module.exports = mongoose.model('Course', courseSchema);
