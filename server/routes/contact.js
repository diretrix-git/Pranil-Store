const express = require('express');
const { sendMessage, getMessages, markRead } = require('../controllers/contact');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/restrictTo');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

const router = express.Router();

const contactValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').escape(),
  body('email').trim().isEmail().withMessage('Valid email required'),
  body('subject').trim().notEmpty().withMessage('Subject is required').escape(),
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 2000 }).escape(),
];

// Public — anyone can send a message
router.post('/', contactValidation, validate, sendMessage);

// Admin only — view messages
router.get('/', protect, restrictTo('admin'), getMessages);
router.patch('/:id/read', protect, restrictTo('admin'), markRead);

module.exports = router;
