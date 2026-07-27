import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const saveFileToCloudinary = (buffer, userId) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'avatars',
        public_id: userId.toString(),
        resource_type: 'image',
        overwrite: true,
        invalidate: true,
      },
      (error, uploadResult) => {
        if (error) {
          reject(error);

          return;
        }

        resolve(uploadResult);
      },
    );

    uploadStream.end(buffer);
  });
};
