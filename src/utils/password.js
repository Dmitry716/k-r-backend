const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const BCRYPT_ROUNDS = 12;

function isBcryptHash(hash) {
  return typeof hash === 'string' && hash.startsWith('$2');
}

function legacySha256(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') return false;
  if (isBcryptHash(storedHash)) {
    return bcrypt.compare(password, storedHash);
  }
  return legacySha256(password) === storedHash;
}

module.exports = { hashPassword, verifyPassword, isBcryptHash };
