/**
 * Verifies Google reCAPTCHA v2 token server-side.
 * When RECAPTCHA_SECRET_KEY is unset, verification is skipped (dev only).
 */
async function verifyRecaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    return { ok: true, skipped: true };
  }

  if (!token || typeof token !== 'string') {
    return { ok: false, reason: 'recaptcha_required' };
  }

  const params = new URLSearchParams({
    secret,
    response: token,
  });

  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await response.json();
  if (!data.success) {
    return { ok: false, reason: 'recaptcha_failed', errors: data['error-codes'] };
  }

  return { ok: true };
}

module.exports = { verifyRecaptcha };
