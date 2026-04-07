import { Router } from "express";
import { placeOrder, getBuyerOrders, updateOrderStatus, getInvoice, getAllOrders } from "../controllers/orders";
import { statusValidation } from "../validators/orders";
import { validate } from "../middleware/validate";
import { protect } from "../middleware/auth";
import { restrictTo } from "../middleware/restrictTo";
import { orderLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/", protect, restrictTo("buyer"), orderLimiter, placeOrder);
router.get("/my", protect, restrictTo("buyer"), getBuyerOrders);
router.get("/:orderId/invoice", protect, getInvoice);
router.get("/", protect, restrictTo("admin"), getAllOrders);
router.patch("/:orderId/status", protect, restrictTo("admin"), statusValidation, validate, updateOrderStatus);

export default router;
