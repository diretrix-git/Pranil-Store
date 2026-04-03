const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const AppError = require('./AppError');

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only JPEG, PNG, and WebP images are allowed.', 422));
  }
};

const limits = { fileSize: 5 * 1024 * 1024 };

const productStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: `stores/${req.storeId}/products`,
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  }),
});

const logoStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: `stores/${req.storeId}/logo`,
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  }),
});

const uploadProductImages = multer({ storage: productStorage, fileFilter, limits }).array('images', 10);

const uploadStoreLogo = multer({ storage: logoStorage, fileFilter, limits }).single('logo');

const deleteCloudinaryImage = async (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

const getPublicIdFromUrl = (url) => {
  // Extract path after /upload/
  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) return null;

  const afterUpload = url.slice(uploadIndex + '/upload/'.length);

  // Remove version prefix (e.g. v1234567890/)
  const withoutVersion = afterUpload.replace(/^v\d+\//, '');

  // Remove file extension
  const publicId = withoutVersion.replace(/\.[^/.]+$/, '');

  return publicId;
};

module.exports = { uploadProductImages, uploadStoreLogo, deleteCloudinaryImage, getPublicIdFromUrl };
