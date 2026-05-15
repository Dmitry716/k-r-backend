const AUTH_COOKIE_NAME = 'admin_token';
const COOKIE_MAX_AGE_SEC = 24 * 60 * 60;

function parseCookies(req) {
  const header = req.headers.cookie;
  if (!header || typeof header !== 'string') return {};
  const cookies = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

function getAuthToken(req) {
  const bearer = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (bearer) return bearer;
  return parseCookies(req)[AUTH_COOKIE_NAME] || null;
}

function setAuthCookie(res, token) {
  const parts = [
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${COOKIE_MAX_AGE_SEC}`,
  ];
  if (process.env.NODE_ENV === 'production') {
    parts.push('Secure');
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearAuthCookie(res) {
  const parts = [
    `${AUTH_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    'Max-Age=0',
  ];
  if (process.env.NODE_ENV === 'production') {
    parts.push('Secure');
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

module.exports = {
  AUTH_COOKIE_NAME,
  getAuthToken,
  setAuthCookie,
  clearAuthCookie,
};
