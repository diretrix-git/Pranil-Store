"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicIdFromUrl = exports.deleteCloudinaryImage = exports.uploadToCloudinary = exports.uploadStoreLogo = exports.uploadProductImages = void 0;
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const AppError_1 = __importDefault(require("./AppError"));
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;
const fileFilter = (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new AppError_1.default("Only JPEG, PNG, and WebP images are allowed.", 422));
    }
};
const memStorage = multer_1.default.memoryStorage();
const uploadProductImages = (req, res, next) => {
    (0, multer_1.default)({ storage: memStorage, fileFilter, limits: { fileSize: MAX_SIZE } }).array("images", 10)(req, res, (err) => {
        if (err)
            return next(new AppError_1.default(err.message || "Upload error.", 422));
        next();
    });
};
exports.uploadProductImages = uploadProductImages;
const uploadStoreLogo = (req, res, next) => {
    (0, multer_1.default)({ storage: memStorage, fileFilter, limits: { fileSize: MAX_SIZE } }).single("logo")(req, res, (err) => {
        if (err)
            return next(new AppError_1.default(err.message || "Upload error.", 422));
        next();
    });
};
exports.uploadStoreLogo = uploadStoreLogo;
const uploadToCloudinary = async (buffer, folder, mimetype) => {
    const ext = mimetype.split("/")[1].replace("jpeg", "jpg");
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.default.uploader.upload_stream({ folder, resource_type: "image", format: ext }, (error, result) => {
            if (error)
                return reject(new AppError_1.default("Cloudinary upload failed: " + error.message, 500));
            resolve(result.secure_url);
        });
        stream.end(buffer);
    });
};
exports.uploadToCloudinary = uploadToCloudinary;
const deleteCloudinaryImage = async (publicId) => {
    return cloudinary_1.default.uploader.destroy(publicId);
};
exports.deleteCloudinaryImage = deleteCloudinaryImage;
const getPublicIdFromUrl = (url) => {
    const uploadIndex = url.indexOf("/upload/");
    if (uploadIndex === -1)
        return null;
    const afterUpload = url.slice(uploadIndex + "/upload/".length);
    const withoutVersion = afterUpload.replace(/^v\d+\//, "");
    return withoutVersion.replace(/\.[^/.]+$/, "");
};
exports.getPublicIdFromUrl = getPublicIdFromUrl;
