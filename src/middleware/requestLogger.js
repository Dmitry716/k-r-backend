/**
 * Lightweight request logging for ops (no passwords/tokens in logs).
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    if (process.env.NODE_ENV === 'production' && req.path === '/api/health') {
      return;
    }
    const durationMs = Date.now() - start;
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl || req.url,
      status: res.statusCode,
      durationMs,
      ip: req.ip,
    });
    if (res.statusCode >= 500) {
      console.error(line);
    } else if (process.env.NODE_ENV !== 'production') {
      console.log(line);
    }
  });
  next();
}

module.exports = { requestLogger };
