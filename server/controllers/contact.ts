import { Request, Response, NextFunction } from "express";
import Contact from "../models/Contact";
import logger from "../utils/logger";

export const sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, phone, subject, message } = req.body;
    const contact = await Contact.create({ name, email, phone, subject, message });
    logger.info(`📬 New contact message from ${name} <${email}>: ${subject}`);

    const io = (req.app as any).get("io");
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
  } catch (err) { next(err); }
};

export const getMessages = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const messages = await Contact.find({ isDeleted: false }).sort({ createdAt: -1 });
    res.status(200).json({ status: "success", data: { messages, count: messages.length }, message: "Messages retrieved" });
  } catch (err) { next(err); }
};

export const markRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const msg = await Contact.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    res.status(200).json({ status: "success", data: { message: msg }, message: "Marked as read" });
  } catch (err) { next(err); }
};
