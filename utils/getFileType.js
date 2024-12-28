const getFileType = (fileName) => {
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp"];
  const videoExtensions = [".mp4", ".avi", ".mov", ".wmv"];
  const musicExtensions = [".mp3", ".wav", ".aac", ".flac"];

  const fileExtension = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();

  if (imageExtensions.includes(fileExtension)) {
    return "image";
  } else if (videoExtensions.includes(fileExtension)) {
    return "video";
  } else if (musicExtensions.includes(fileExtension)) {
    return "audio";
  } else {
    return "raw"; // Default to raw if no matching type
  }
};

module.exports = {
  getFileType,
};
