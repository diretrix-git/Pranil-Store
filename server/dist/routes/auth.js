"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Called by the client after Clerk sign-in to sync user into MongoDB
// requireAuth validates the Clerk session; protect upserts the MongoDB record
router.get("/me", auth_1.requireAuth, auth_1.protect, (req, res) => {
    res.status(200).json({
        status: "success",
        data: { user: req.user },
        message: "User profile retrieved",
    });
});
exports.default = router;
