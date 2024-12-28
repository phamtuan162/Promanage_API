const multer = require("multer");
const { attachmentFile } = require("../../utils/validators");

const customFileFilter = (req, file, cb) => {
  if (!attachmentFile.allowedTypes.includes(file.mimetype)) {
    const error = new Error("File type is invalid.");
    return cb(error, false); // Trả lỗi qua cb
  }
  return cb(null, true); // Không có lỗi và chấp nhận file
};

const attachment = multer({
  limits: { fileSize: attachmentFile.fileSize },
  fileFilter: customFileFilter,
});

module.exports = {
  attachment,
};
