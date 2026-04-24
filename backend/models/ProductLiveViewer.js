const mongoose = require("mongoose");

const productLiveViewerSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    viewerKey: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    lastSeenAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  },
);

productLiveViewerSchema.index({ product: 1, viewerKey: 1 }, { unique: true });
productLiveViewerSchema.index({ lastSeenAt: 1 }, { expireAfterSeconds: 120 });

module.exports = mongoose.model("ProductLiveViewer", productLiveViewerSchema);
