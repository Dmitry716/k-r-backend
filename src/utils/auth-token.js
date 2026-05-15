const AUTH_COOKIE_NAME = 'admin_token';

function getAuthToken(req) {
  const bearer = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (bearer) return bearer;
  return req.cookies?.[AUTH_COOKIE_NAME] || null;
}

function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
}

module.exports = {
  AUTH_COOKIE_NAME,
  getAuthToken,
  setAuthCookie,
  clearAuthCookie,
};
