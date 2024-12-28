const { rejects } = require("assert");
const cloudinary = require("cloudinary");
const { resolve } = require("path");
const streamifier = require("streamifier");

const cloudinaryV2 = cloudinary.v2;

// Cấu hình cloudinary, sử dụng version2
cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Khởi tạo một cái function để upload ảnh lên cloudinary
const streamUpload = (fileBuffer, folderName) => {
  return new Promise((resolve, reject) => {
    // Tạo 1 cái luồng stream upload lên cloudinary
    const stream = cloudinaryV2.uploader.upload_stream(
      { folder: folderName },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};
const streamUploadFile = (fileBuffer, folderName, fileType) => {
  return new Promise((resolve, reject) => {
    // Tạo 1 cái luồng stream upload lên cloudinary
    const stream = cloudinaryV2.uploader.upload_stream(
      { resource_type: fileType, folder: folderName },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};
module.exports = { streamUpload, streamUploadFile };
