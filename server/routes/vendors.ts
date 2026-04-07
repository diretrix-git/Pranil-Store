import { Router } from "express";
import { getVendors, getAllVendors, createVendor, updateVendor, deleteVendor } from "../controllers/vendors";
import { requireAuth, protect } from "../middleware/auth";
import { restrictTo } from "../middleware/restrictTo";

const router = Router();

router.get("/all", requireAuth, protect, restrictTo("admin"), getAllVendors);
router.post("/", requireAuth, protect, restrictTo("admin"), createVendor);
router.put("/:id", requireAuth, protect, restrictTo("admin"), updateVendor);
router.delete("/:id", requireAuth, protect, restrictTo("admin"), deleteVendor);
router.get("/", getVendors);

export default router;
