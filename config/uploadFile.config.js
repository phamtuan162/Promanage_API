// Import thư viện mime-types để xác định loại MIME của tệp
var mime = require("mime-types");

// Hàm tạo tên file duy nhất cho avatar
const generateUniqueFileName = (mimetype) => {
  // Tạo một phần tử đuôi file ngẫu nhiên để tránh trùng lặp
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  // Sử dụng thư viện mime-types để lấy phần mở rộng của loại MIME
  return `${uniqueSuffix}.${mime.extension(mimetype)}`;
};

// Xuất cấu hình cho quá trình tải lên avatar
module.exports = {
  uploadAvatar: {
    // Đường dẫn đích cho avatar tải lên
    destination: "public/images/avatars/uploads/",
    // Hàm tạo tên file cho avatar
    name: generateUniqueFileName,
    // Các loại tệp cho phép
    allowedTypes: ["image/jpg", "image/jpeg", "image/png"],
    // Kích thước tệp tối đa (10MB)
    fileSize: 1024 * 1024 * 10,
  },
  uploadFile: {
    // Đường dẫn đích cho tệp tải lên
    destination: "public/uploads/",
    // Hàm tạo tên file cho tệp
    name: generateUniqueFileName,
    // Các loại tệp cho phép
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
    // Kích thước tệp tối đa (5MB)
    fileSize: 1024 * 1024 * 5,
  },
};
