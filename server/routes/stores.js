const express = require("express");
const {
  getMyStore,
  updateMyStore,
  getAllStores,
  toggleStoreStatus,
} = require("../controllers/stores");
const { uploadStoreLogo } = require("../utils/cloudinaryHelper");
const { protect } = require("../middleware/auth");
const { requireStore } = require("../middleware/requireStore");
const { restrictTo } = require("../middleware/restrictTo");

const router = express.Router();

router.get("/me", protect, requireStore, restrictTo("seller"), getMyStore);
router.put(
  "/me",
  protect,
  requireStore,
  restrictTo("seller"),
  uploadStoreLogo,
  updateMyStore,
);
router.get("/", protect, restrictTo("superadmin"), getAllStores);
router.patch(
  "/:id/status",
  protect,
  restrictTo("superadmin"),
  toggleStoreStatus,
);

module.exports = router;
