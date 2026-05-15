const crypto = require('crypto');
const { promisify } = require('util');

const scryptAsync = promisify(crypto.scrypt);
const SCRYPT_PREFIX = 'scrypt:';

function legacySha256(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function isScryptHash(hash) {
  return typeof hash === 'string' && hash.startsWith(SCRYPT_PREFIX);
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derived = await scryptAsync(password, salt, 64);
  return `${SCRYPT_PREFIX}${salt.toString('hex')}:${derived.toString('hex')}`;
}

async function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') return false;

  if (isScryptHash(storedHash)) {
    const rest = storedHash.slice(SCRYPT_PREFIX.length);
    const colon = rest.indexOf(':');
    if (colon === -1) return false;
    const salt = Buffer.from(rest.slice(0, colon), 'hex');
    const expected = Buffer.from(rest.slice(colon + 1), 'hex');
    const derived = await scryptAsync(password, salt, 64);
    if (expected.length !== derived.length) return false;
    return crypto.timingSafeEqual(expected, derived);
  }

  if (storedHash.startsWith('$2')) {
    try {
      return require('bcryptjs').compare(password, storedHash);
    } catch {
      return false;
    }
  }

  return legacySha256(password) === storedHash;
}

module.exports = { hashPassword, verifyPassword, isScryptHash };
