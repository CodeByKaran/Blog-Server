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

const uploadMultipleImagesToCloud = async (
  filePathArrays: string[]
): Promise<string[]> => {
  return Promise.all(
    filePathArrays.map(async (filePath) => {
      try {
        const result = await uploadImageToCloud(filePath);
        return result.url; // ✅ only return secure_url
      } catch (error) {
        console.error(`❌ Error uploading file: ${filePath}`, error);
        throw new ApiError(
          `Failed to upload image: ${filePath}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    })
  );
};

const deleteImageFromCloud = async (publicId: string) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });

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

const getCloudinaryPublicId = (url: string) => {
  try {
    const match = url.match(/\/([a-zA-Z0-9]+)\.png$/);

    return match ? `blogs/${match[1]}` : null;
  } catch {
    return null;
  }
};

const deleteMultipleImagesFromCloud = async (urls: string[]) => {
  return Promise.all(
    urls.map(async (url) => {
      try {
        const id = getCloudinaryPublicId(url);
        console.log("public id:", id);

        const result = await deleteImageFromCloud(id!);
        console.log("image deleted of id ", id);

        return result;
      } catch (error) {
        console.error(`❌ Error uploading file: `, error);
        throw new ApiError(
          `Failed to delete images`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    })
  );
};

export {
  uploadImageToCloud,
  deleteImageFromCloud,
  uploadMultipleImagesToCloud,
  getCloudinaryPublicId,
  deleteMultipleImagesFromCloud,
};
