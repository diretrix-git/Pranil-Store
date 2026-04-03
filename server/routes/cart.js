const express = require("express");
const {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
} = require("../controllers/cart");
const { protect } = require("../middleware/auth");
const { restrictTo } = require("../middleware/restrictTo");

const router = express.Router();

router.use(protect, restrictTo("buyer"));

router.get("/", getCart);
router.post("/add", addItem);
router.patch("/item/:productId", updateItem);
router.delete("/item/:productId", removeItem);
router.delete("/clear", clearCart);

module.exports = router;
