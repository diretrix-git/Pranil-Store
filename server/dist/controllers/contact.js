"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markRead = exports.getMessages = exports.sendMessage = void 0;
const Contact_1 = __importDefault(require("../models/Contact"));
const logger_1 = __importDefault(require("../utils/logger"));
const sendMessage = async (req, res, next) => {
    try {
        const { name, email, phone, subject, message } = req.body;
        const contact = await Contact_1.default.create({ name, email, phone, subject, message });
        logger_1.default.info(`📬 New contact message from ${name} <${email}>: ${subject}`);
        const io = req.app.get("io");
        if (io) {
            io.to("admin_room").emit("new_message", {
                _id: contact._id, name, email, phone, subject, receivedAt: contact.createdAt,
            });
        }
        res.status(201).json({
            status: "success",
            data: { contact: { _id: contact._id, subject: contact.subject, createdAt: contact.createdAt } },
            message: "Message sent successfully. We will get back to you soon.",
        });
    }
    catch (err) {
        next(err);
    }
};
exports.sendMessage = sendMessage;
const getMessages = async (_req, res, next) => {
    try {
        const messages = await Contact_1.default.find({ isDeleted: false }).sort({ createdAt: -1 });
        res.status(200).json({ status: "success", data: { messages, count: messages.length }, message: "Messages retrieved" });
    }
    catch (err) {
        next(err);
    }
};
exports.getMessages = getMessages;
const markRead = async (req, res, next) => {
    try {
        const msg = await Contact_1.default.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
        res.status(200).json({ status: "success", data: { message: msg }, message: "Marked as read" });
    }
    catch (err) {
        next(err);
    }
};
exports.markRead = markRead;
