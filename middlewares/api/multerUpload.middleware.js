const multer = require("multer");
const { uploadAvatar } = require("../../utils/validators");

const customFileFilter = (req, file, cb) => {
  if (!uploadAvatar.allowedTypes.includes(file.mimetype)) {
    const error = new Error(
      "File type is invalid. Only accept jpg, jpeg and png"
    );
    return cb(error, false); // Trả lỗi qua cb
  }
  return cb(null, true); // Không có lỗi và chấp nhận file
};

const upload = multer({
  limits: { fileSize: uploadAvatar.fileSize },
  fileFilter: customFileFilter,
});

module.exports = {
  upload,
};
