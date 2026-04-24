const multer = require("multer");

const memoryStorage = multer.memoryStorage();

function fileFilterByTypes(allowedMimeTypes) {
  return (req, file, cb) => {
    const rawMimeType = String(file?.mimetype || "")
      .trim()
      .toLowerCase();
    const normalizedMimeType = rawMimeType.split(";")[0].trim();

    if (
      !file ||
      allowedMimeTypes.includes(rawMimeType) ||
      allowedMimeTypes.includes(normalizedMimeType)
    ) {
      cb(null, true);
      return;
    }

    cb(new Error(`Unsupported file type: ${file?.mimetype || "unknown"}`));
  };
}

const audioUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: fileFilterByTypes([
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/webm",
    "audio/ogg",
    "audio/mp4",
    "audio/x-m4a",
  ]),
});

const imageUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: fileFilterByTypes([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ]),
});

module.exports = {
  audioUpload,
  imageUpload,
};
