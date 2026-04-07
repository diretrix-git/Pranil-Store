import { Router } from "express";
import { getVendors, getAllVendors, createVendor, updateVendor, deleteVendor } from "../controllers/vendors";
import { protect } from "../middleware/auth";
import { restrictTo } from "../middleware/restrictTo";

const router = Router();

// /all must come BEFORE /:id
router.get("/all", protect, restrictTo("admin"), getAllVendors);
router.post("/", protect, restrictTo("admin"), createVendor);
router.put("/:id", protect, restrictTo("admin"), updateVendor);
router.delete("/:id", protect, restrictTo("admin"), deleteVendor);
router.get("/", getVendors);

export default router;
