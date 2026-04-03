const express = require('express');
const { register, login, logout, getMe } = require('../controllers/auth');
const { registerValidation, loginValidation } = require('../validators/auth');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Apply auth rate limiter to all routes in this router
router.use(authLimiter);

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;
