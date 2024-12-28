const multer = require("multer");
const { uploadFile: uploadConfig } = require("../config/uploadFile.config");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadConfig.destination);
  },
  filename: function (req, file, cb) {
    cb(null, uploadConfig.name(file.mimetype));
  },
});

function fileFilter(req, file, cb) {
  console.log(file);

  const allowedTypes = uploadConfig.allowedTypes;
  const allowedExtensions = [".mdj"];
  const fileExtension = file.originalname
    .slice(file.originalname.lastIndexOf("."))
    .toLowerCase();

  if (
    allowedTypes.includes(file.mimetype) ||
    allowedExtensions.includes(fileExtension)
  ) {
    cb(null, true);
  } else {
    const error = new Error("Định dạng file không hợp lệ");
    error.status = 400;
    cb(error, false);
  }
}

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: uploadConfig.fileSize,
  },
});

module.exports = {
  multerMiddleware: (req, res, next) => {
    upload.single("file")(req, res, function (err) {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.message === "File too large") {
            return res.status(400).json({
              error: "Vượt quá kích thước tệp cho phép (5MB)",
            });
          }
          return res
            .status(400)
            .json({ error: err.message, message: err.message });
        } else {
          return res
            .status(400)
            .json({ error: err.message, message: err.message });
        }
      }

      next();
    });
  },
};
