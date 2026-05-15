const jwt = require('jsonwebtoken');

/**
 * Requires valid admin JWT in Authorization: Bearer header.
 */
function requireAdmin(req, res, next) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'Требуется токен' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Недостаточно прав' });
    }
    req.admin = decoded;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Невалидный токен' });
  }
}

module.exports = { requireAdmin };
