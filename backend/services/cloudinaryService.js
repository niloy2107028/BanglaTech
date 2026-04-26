const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      },
    );
    stream.end(buffer);
  });
}

function extractPublicId(url) {
  if (!url || !url.includes("res.cloudinary.com")) return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^./]+)?$/i);
  return match ? match[1] : null;
}

async function deleteFromCloudinary(url) {
  if (!url || !url.includes("res.cloudinary.com")) return;
  try {
    const publicId = extractPublicId(url);
    if (publicId) await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("[Cloudinary] delete error:", err.message);
  }
}

async function deleteAllFromCloudinary(urls) {
  if (!Array.isArray(urls)) return;
  const targets = urls.filter((u) => u && u.includes("res.cloudinary.com"));
  if (targets.length === 0) return;
  await Promise.allSettled(targets.map(deleteFromCloudinary));
}

module.exports = { uploadToCloudinary, deleteFromCloudinary, deleteAllFromCloudinary };
