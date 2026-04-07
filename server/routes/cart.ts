import { Router } from "express";
import { getCart, addItem, updateItem, removeItem, clearCart } from "../controllers/cart";
import { requireAuth, protect } from "../middleware/auth";
import { restrictTo } from "../middleware/restrictTo";

const router = Router();

router.use(requireAuth, protect, restrictTo("buyer"));

router.get("/", getCart);
router.post("/add", addItem);
router.patch("/item/:productId", updateItem);
router.delete("/item/:productId", removeItem);
router.delete("/clear", clearCart);

export default router;
