const mongoose = require("mongoose");
const ProductLiveViewer = require("../models/ProductLiveViewer");

const VIEWER_TTL_MS = 45 * 1000;

function normalizeId(value) {
  return String(value || "").trim();
}

function normalizeViewerKey(value) {
  return String(value || "")
    .trim()
    .slice(0, 180);
}

function cutoffDate(now = Date.now()) {
  return new Date(Number(now) - VIEWER_TTL_MS);
}

async function touchViewer(productId, viewerKey, now = Date.now()) {
  const normalizedProductId = normalizeId(productId);
  const normalizedViewerKey = normalizeViewerKey(viewerKey);
  if (!mongoose.Types.ObjectId.isValid(normalizedProductId) || !normalizedViewerKey) {
    return 0;
  }

  const nowDate = new Date(Number(now));
  const productObjectId = new mongoose.Types.ObjectId(normalizedProductId);

  await ProductLiveViewer.updateOne(
    { product: productObjectId, viewerKey: normalizedViewerKey },
    {
      $set: {
        product: productObjectId,
        viewerKey: normalizedViewerKey,
        lastSeenAt: nowDate,
      },
    },
    { upsert: true },
  );

  const activeCutoff = cutoffDate(now);
  return ProductLiveViewer.countDocuments({
    product: productObjectId,
    lastSeenAt: { $gte: activeCutoff },
  });
}

async function removeViewer(productId, viewerKey) {
  const normalizedProductId = normalizeId(productId);
  const normalizedViewerKey = normalizeViewerKey(viewerKey);
  if (!mongoose.Types.ObjectId.isValid(normalizedProductId) || !normalizedViewerKey) {
    return 0;
  }

  const productObjectId = new mongoose.Types.ObjectId(normalizedProductId);
  await ProductLiveViewer.deleteOne({
    product: productObjectId,
    viewerKey: normalizedViewerKey,
  });

  const activeCutoff = cutoffDate();
  return ProductLiveViewer.countDocuments({
    product: productObjectId,
    lastSeenAt: { $gte: activeCutoff },
  });
}

async function getViewerCount(productId, now = Date.now()) {
  const normalizedProductId = normalizeId(productId);
  if (!mongoose.Types.ObjectId.isValid(normalizedProductId)) {
    return 0;
  }

  const productObjectId = new mongoose.Types.ObjectId(normalizedProductId);
  const activeCutoff = cutoffDate(now);
  return ProductLiveViewer.countDocuments({
    product: productObjectId,
    lastSeenAt: { $gte: activeCutoff },
  });
}

module.exports = {
  VIEWER_TTL_MS,
  touchViewer,
  removeViewer,
  getViewerCount,
};
