import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
import { logger } from "./logger.js";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const safeUnlink = async (filePath) => {
  let attempts = 0;
  const maxAttempts = 5;
  while (attempts < maxAttempts) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return;
    } catch (error) {
      if ((error.code === "EBUSY" || error.code === "EPERM") && attempts < maxAttempts - 1) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 500));
      } else {
        throw error;
      }
    }
  }
};

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    if (!fs.existsSync(localFilePath)) {
      logger.error(`File does not exist at: ${localFilePath}`);
      return null;
    }

    const isVideo = localFilePath.match(/\.(mp4|mkv|mov|avi|webm|flv|wmv|3gp|ogg)$/i);
    const stats = fs.statSync(localFilePath);
    const fileSizeInBytes = stats.size;
    const resourceType = isVideo ? "video" : "auto";

    logger.info(`Uploading file to Cloudinary: Path="${localFilePath}", Size=${fileSizeInBytes} bytes, isVideo=${!!isVideo}, resourceType="${resourceType}"`);

    let response;
    // Use upload_large only for files larger than 10MB
    if (fileSizeInBytes > 10 * 1024 * 1024) {
      logger.info(`Using upload_large for file: ${localFilePath}`);
      response = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_large(
          localFilePath,
          {
            resource_type: resourceType,
            chunk_size: 5 * 1024 * 1024, // 5MB chunk size (must be <= 10MB to avoid chunk limit)
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
      });
    } else {
      logger.info(`Using standard upload for file: ${localFilePath}`);
      response = await cloudinary.uploader.upload(localFilePath, {
        resource_type: resourceType,
      });
    }

    await safeUnlink(localFilePath);
    return response;
  } catch (error) {
    logger.error("Error uploading to Cloudinary: " + JSON.stringify(error, Object.getOwnPropertyNames(error)));
    try {
      await safeUnlink(localFilePath);
    } catch (unlinkError) {
      logger.error("Error unlinking local file: " + unlinkError.message);
    }
    return null;
  }
};

const deleteFromCloudinary = async (publicId) => {
  try{
    const result =await cloudinary.uploader.destroy(publicId);
    console.log("file is deleted from cloudinary ", publicId);
  }catch (error) {
    console.error("Error deleting file from Cloudinary:", error);
    return false;
  }

}

export { uploadOnCloudinary,deleteFromCloudinary };
