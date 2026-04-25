"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const auth_2 = require("../controllers/auth");
const router = (0, express_1.Router)();
// Only endpoint needed — syncs Clerk session into MongoDB and returns role
router.get("/me", auth_1.requireAuth, auth_1.protect, auth_2.getMe);
exports.default = router;
