"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = void 0;
// Auth is fully managed by Clerk.
// This controller only handles the /me endpoint which syncs Clerk → MongoDB.
// All registration, login, logout, and password reset is handled by Clerk's hosted UI.
const getMe = async (req, res, next) => {
    try {
        res.status(200).json({
            status: "success",
            data: { user: req.user },
            message: "User profile retrieved",
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getMe = getMe;
