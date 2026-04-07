import { Router } from "express";
import { placeOrder, getBuyerOrders, updateOrderStatus, getInvoice, getAllOrders } from "../controllers/orders";
import { statusValidation } from "../validators/orders";
import { validate } from "../middleware/validate";
import { requireAuth, protect } from "../middleware/auth";
import { restrictTo } from "../middleware/restrictTo";
import { orderLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/", requireAuth, protect, restrictTo("buyer"), orderLimiter, placeOrder);
router.get("/my", requireAuth, protect, restrictTo("buyer"), getBuyerOrders);
router.get("/:orderId/invoice", requireAuth, protect, getInvoice);
router.get("/", requireAuth, protect, restrictTo("admin"), getAllOrders);
router.patch("/:orderId/status", requireAuth, protect, restrictTo("admin"), statusValidation, validate, updateOrderStatus);

export default router;
