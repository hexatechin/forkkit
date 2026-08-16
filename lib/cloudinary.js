import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage({ buffer, storefrontId, folder, type }) {
  if (!buffer) {
    throw new Error("Image buffer is required");
  }

  if (!storefrontId) {
    throw new Error("Storefront ID is required");
  }

  if (!folder) {
    throw new Error("Cloudinary folder is required");
  }

  if (!type) {
    throw new Error("Image type is required");
  }

  const fileId = crypto.randomUUID();

  const cloudinaryFolder = `indocia/${process.env.NODE_ENV}/${storefrontId}/${folder}/${type}`;

  console.log("Cloudinary folder:", cloudinaryFolder);

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: cloudinaryFolder,
        public_id: fileId,
        resource_type: "image",
        quality: "auto",
        fetch_format: "auto",
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary error:", error);

          reject(error);
          return;
        }

        console.log("Cloudinary upload successful:", result?.secure_url);

        resolve(result);
      },
    );

    stream.on("error", (error) => {
      console.error("Cloudinary stream error:", error);

      reject(error);
    });

    stream.end(buffer);
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    fileId,
    folder: cloudinaryFolder,
  };
}

export async function deleteImage(imageUrl) {
  if (!imageUrl) return null;

  try {
    const url = new URL(imageUrl);

    const uploadIndex = url.pathname.indexOf("/upload/");
    if (uploadIndex === -1) {
      throw new Error("Invalid Cloudinary image URL");
    }

    let publicId = url.pathname.substring(uploadIndex + "/upload/".length);

    publicId = publicId.replace(/^v\d+\//, "");

    publicId = publicId.replace(/\.[^/.]+$/, "");

    publicId = decodeURIComponent(publicId);

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      type: "upload",
      invalidate: true,
    });

    return result;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw error;
  }
}

export async function deleteFolder(folder) {
  if (!folder) return null;

  try {
    // 1. Delete all resources inside the folder
    const deleteResult = await cloudinary.api.delete_resources_by_prefix(
      folder,
      {
        resource_type: "image",
        type: "upload",
        invalidate: true,
      },
    );

    // 2. Delete the actual empty folder
    let folderResult = null;

    try {
      folderResult = await cloudinary.api.delete_folder(folder);
    } catch (folderError) {
      // Cloudinary may already consider the folder removed
      // after deleting its resources.
      console.warn("Cloudinary folder delete warning:", folderError?.message);
    }

    return {
      deleteResult,
      folderResult,
    };
  } catch (error) {
    console.error("Cloudinary deleteFolder error:", error);
    throw error;
  }
}
