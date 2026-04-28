const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema(
  {
    publicId:    { type: String, required: true },
    url:         { type: String, required: true },
    title:       { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    customThumbnail: {
      url:      { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    duration:    { type: Number, default: 0 },   // seconds
    order:       { type: Number, default: 0 },
    isFree:      { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
  },
  { _id: true }
);

// Returns custom thumbnail if set, otherwise falls back to Cloudinary auto-generated frame
videoSchema.methods.getThumbnail = function () {
  if (this.customThumbnail?.url) return this.customThumbnail.url;
  return this.url.replace('/upload/', '/upload/so_0,w_640/');
};

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
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
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
