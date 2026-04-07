import multer, { FileFilterCallback } from "multer";
import { Request, Response, NextFunction } from "express";
import cloudinary from "../config/cloudinary";
import AppError from "./AppError";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError("Only JPEG, PNG, and WebP images are allowed.", 422) as any);
  }
};

const memStorage = multer.memoryStorage();

export const uploadProductImages = (req: Request, res: Response, next: NextFunction): void => {
  multer({ storage: memStorage, fileFilter, limits: { fileSize: MAX_SIZE } }).array("images", 10)(
    req,
    res,
    (err: any) => {
      if (err) return next(new AppError(err.message || "Upload error.", 422));
      next();
    },
  );
};

export const uploadStoreLogo = (req: Request, res: Response, next: NextFunction): void => {
  multer({ storage: memStorage, fileFilter, limits: { fileSize: MAX_SIZE } }).single("logo")(
    req,
    res,
    (err: any) => {
      if (err) return next(new AppError(err.message || "Upload error.", 422));
      next();
    },
  );
};

export const uploadToCloudinary = async (
  buffer: Buffer,
  folder: string,
  mimetype: string,
): Promise<string> => {
  const ext = mimetype.split("/")[1].replace("jpeg", "jpg");
  return new Promise((resolve, reject) => {
    const stream = (cloudinary as any).uploader.upload_stream(
      { folder, resource_type: "image", format: ext },
      (error: any, result: any) => {
        if (error) return reject(new AppError("Cloudinary upload failed: " + error.message, 500));
        resolve(result.secure_url);
      },
    );
    stream.end(buffer);
  });
};

export const deleteCloudinaryImage = async (publicId: string): Promise<any> => {
  return (cloudinary as any).uploader.destroy(publicId);
};

export const getPublicIdFromUrl = (url: string): string | null => {
  const uploadIndex = url.indexOf("/upload/");
  if (uploadIndex === -1) return null;
  const afterUpload = url.slice(uploadIndex + "/upload/".length);
  const withoutVersion = afterUpload.replace(/^v\d+\//, "");
  return withoutVersion.replace(/\.[^/.]+$/, "");
};
