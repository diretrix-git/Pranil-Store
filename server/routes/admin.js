const express = require("express");
const {
  getAllUsers,
  toggleUserStatus,
  getPlatformStats,
} = require("../controllers/admin");
const { protect } = require("../middleware/auth");
const { restrictTo } = require("../middleware/restrictTo");

const router = express.Router();

router.use(protect, restrictTo("admin"));

router.get("/users", getAllUsers);
router.patch("/users/:id/status", toggleUserStatus);
router.get("/stats", getPlatformStats);

module.exports = router;
