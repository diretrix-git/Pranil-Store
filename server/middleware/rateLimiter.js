// Rate limiting disabled — all limiters are no-ops
const noLimit = (req, res, next) => next();

const authLimiter = noLimit;
const generalLimiter = noLimit;
const orderLimiter = noLimit;
const uploadLimiter = noLimit;

module.exports = { authLimiter, generalLimiter, orderLimiter, uploadLimiter };
