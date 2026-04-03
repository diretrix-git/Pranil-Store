const Contact = require('../models/Contact');
const logger = require('../utils/logger');

const sendMessage = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Save to DB
    const contact = await Contact.create({ name, email, phone, subject, message });

    // Log it so admin can see in server logs too
    logger.info(`📬 New contact message from ${name} <${email}>: ${subject}`);

    res.status(201).json({
      status: 'success',
      data: { contact: { _id: contact._id, subject: contact.subject, createdAt: contact.createdAt } },
      message: 'Message sent successfully. We will get back to you soon.',
    });
  } catch (err) {
    next(err);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const messages = await Contact.find({ isDeleted: false }).sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', data: { messages, count: messages.length }, message: 'Messages retrieved' });
  } catch (err) {
    next(err);
  }
};

const markRead = async (req, res, next) => {
  try {
    const msg = await Contact.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    res.status(200).json({ status: 'success', data: { message: msg }, message: 'Marked as read' });
  } catch (err) {
    next(err);
  }
};

module.exports = { sendMessage, getMessages, markRead };
