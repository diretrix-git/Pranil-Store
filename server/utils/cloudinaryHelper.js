const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const AppError = require('./AppError');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only JPEG, PNG, and WebP images are allowed.', 422));
  }
};

// Use memory storage — upload to Cloudinary manually in controller
const memStorage = multer.memoryStorage();

// Middleware: parse multipart form, store files in memory
const uploadProductImages = (req, res, next) => {
  multer({ storage: memStorage, fileFilter, limits: { fileSize: MAX_SIZE } })
    .array('images', 10)(req, res, (err) => {
      if (err) return next(new AppError(err.message || 'Upload error.', 422));
      next();
    });
};

const uploadStoreLogo = (req, res, next) => {
  multer({ storage: memStorage, fileFilter, limits: { fileSize: MAX_SIZE } })
    .single('logo')(req, res, (err) => {
      if (err) return next(new AppError(err.message || 'Upload error.', 422));
      next();
    });
};

// Upload a buffer to Cloudinary and return the secure URL
const uploadToCloudinary = async (buffer, folder, mimetype) => {
  const ext = mimetype.split('/')[1].replace('jpeg', 'jpg');
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', format: ext },
      (error, result) => {
        if (error) return reject(new AppError('Cloudinary upload failed: ' + error.message, 500));
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};

const deleteCloudinaryImage = async (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

const getPublicIdFromUrl = (url) => {
  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) return null;
  const afterUpload = url.slice(uploadIndex + '/upload/'.length);
  const withoutVersion = afterUpload.replace(/^v\d+\//, '');
  return withoutVersion.replace(/\.[^/.]+$/, '');
};

module.exports = {
  uploadProductImages,
  uploadStoreLogo,
  uploadToCloudinary,
  deleteCloudinaryImage,
  getPublicIdFromUrl,
};
