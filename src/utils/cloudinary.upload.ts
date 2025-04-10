import cloudinary from "../config/cloudinary.config";
import { ApiError, HttpStatus } from "./apiResponse";
import { AsyncHandler } from "./asyncHandler";
import fs from "fs";

const uploadImageToCloud = async (filePath: string) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "image",
      folder: "blogs",
      allowed_formats: ["jpeg", "png", "gif", "jpg", "webp"],
    });

    if (!result.secure_url) {
      throw new ApiError(
        "image is not allowed to be upload",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    fs.unlinkSync(filePath);

    return {
      url: result.secure_url,
      id: result.public_id,
    };
  } catch (error) {
    throw new ApiError(
      "something went wrong on server while uploading image",
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
};

const deleteImageFromCloud = async (publicId: string) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== "ok" && result.result !== "not found") {
      throw new ApiError(
        "Cloudinary failed to delete image",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    return result.result;
  } catch (error) {
    console.error("❌ Cloudinary deletion error:", error);

    throw new ApiError(
      "Something went wrong on server while deleting image",
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
};

export { uploadImageToCloud, deleteImageFromCloud };
