const SellerApplication = require("../models/SellerApplication");
const User = require("../models/User");

// @desc    Apply to become a seller
// @route   POST /api/sellers/apply
// @access  Private (Buyer only)
exports.applyToBeSeller = async (req, res) => {
  try {
    const { shopName, shopDescription, address, phone } = req.body;

    // Check if already a seller
    if (req.user.role === "seller") {
      return res.status(400).json({ success: false, message: "You are already a seller" });
    }

    // Check if existing application
    const existingApp = await SellerApplication.findOne({ user: req.user._id });
    if (existingApp && existingApp.status === "pending") {
      return res.status(400).json({
        success: false,
        message: "You already have a pending application",
      });
    }

    const application = await SellerApplication.create({
      user: req.user._id,
      shopName,
      shopDescription,
      address,
      phone,
    });

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: application,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all applications
// @route   GET /api/sellers/applications
// @access  Private (Admin only)
exports.getApplications = async (req, res) => {
  try {
    const applications = await SellerApplication.find()
      .populate("user", "name email")
      .sort("-createdAt");
    res.json({ success: true, data: applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update application status
// @route   PUT /api/sellers/applications/:id
// @access  Private (Admin only)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status, adminMessage } = req.body;
    const application = await SellerApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    application.status = status;
    if (adminMessage) application.adminMessage = adminMessage;

    if (status === "approved") {
      // Update user role to seller
      await User.findByIdAndUpdate(application.user, { role: "seller" });
    }

    await application.save();

    res.json({
      success: true,
      message: `Application ${status}`,
      data: application,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user's application status
// @route   GET /api/sellers/my-application
// @access  Private
exports.getMyApplication = async (req, res) => {
  try {
    const application = await SellerApplication.findOne({ user: req.user._id });
    res.json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
