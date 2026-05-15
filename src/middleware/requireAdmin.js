const jwt = require('jsonwebtoken');
const { getAuthToken } = require('../utils/auth-token');

/**
 * Requires valid admin JWT (Bearer header or httpOnly cookie).
 */
function requireAdmin(req, res, next) {
  try {
    const token = getAuthToken(req);
    if (!token) {
      return res.status(401).json({ success: false, message: 'Требуется токен' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const allowedRoles = ['admin', 'superadmin'];
    if (!allowedRoles.includes(decoded.role)) {
      return res.status(403).json({ success: false, message: 'Недостаточно прав' });
    }
    req.admin = decoded;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Невалидный токен' });
  }
}

module.exports = { requireAdmin };
