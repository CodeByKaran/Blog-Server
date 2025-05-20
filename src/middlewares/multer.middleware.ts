import multer from "multer";
import path from "path";
import { Request } from "express";

// Define allowed file types
type AllowedMimeType =
  | "image/jpeg"
  | "image/png"
  | "image/gif"
  | "image/jpg"
  | "image/webp";

// Create a type to enforce the allowed MIME types
interface MulterFile extends Express.Multer.File {
  mimetype: AllowedMimeType;
}

// Define storage configuration
const storage = multer.diskStorage({
  destination: function (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) {
    cb(null, path.join(__dirname, "../../public"));
  },
  filename: function (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// Define file filter with proper typings
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  const allowedTypes: AllowedMimeType[] = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/jpg",
    "image/webp",
  ];

  if (allowedTypes.includes(file.mimetype as AllowedMimeType)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, GIF, JPG, and WebP are allowed."
      )
    );
  }
};

// Create and export the multer upload configuration
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB file size limit
});

export { upload };
