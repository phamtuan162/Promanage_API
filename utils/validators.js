module.exports = {
  uploadAvatar: {
    // Các loại tệp cho phép
    allowedTypes: ["image/jpg", "image/jpeg", "image/png"],
    // Kích thước tệp tối đa (10MB)
    fileSize: 1024 * 1024 * 10,
  },
  attachmentFile: {
    allowedTypes: [
      // Ảnh
      "image/jpeg",
      "image/png",
      "image/gif",
      // Tệp văn bản
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      // Thêm các loại MIME của các tệp khác bạn muốn chấp nhận ở đây
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/markdown", // Tệp MagicDraw UML
      "application/vnd.magicdraw+xml",
    ],
    // Kích thước tệp tối đa (10MB)
    fileSize: 1024 * 1024 * 10,
  },
};
