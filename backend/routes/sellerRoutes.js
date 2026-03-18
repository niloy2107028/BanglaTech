const express = require("express");
const router = express.Router();
const {
  applyToBeSeller,
  getApplications,
  updateApplicationStatus,
  getMyApplication,
} = require("../controllers/sellerController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);

router.post("/apply", authorize("buyer"), applyToBeSeller);
router.get("/my-application", authorize("buyer"), getMyApplication);

// Admin only routes
router.get("/applications", authorize("admin"), getApplications);
router.put("/applications/:id", authorize("admin"), updateApplicationStatus);

module.exports = router;
