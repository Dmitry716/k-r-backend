const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.resolve(process.cwd(), 'logs');
const CONSENT_LOG_FILE = path.join(LOGS_DIR, 'consent-leads.log');
const AUDIT_LOG_FILE = path.join(LOGS_DIR, 'pd-requests-audit.log');

function ensureLogsDir() {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
}

function appendJsonLine(filePath, payload) {
  ensureLogsDir();
  fs.appendFileSync(filePath, `${JSON.stringify(payload)}\n`, 'utf8');
}

function appendConsentLog(payload) {
  appendJsonLine(CONSENT_LOG_FILE, payload);
}

function appendAuditLog(payload) {
  appendJsonLine(AUDIT_LOG_FILE, payload);
}

function readJsonLines(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return [];

  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function writeJsonLines(filePath, entries) {
  ensureLogsDir();
  const content = entries.map((entry) => JSON.stringify(entry)).join('\n');
  fs.writeFileSync(filePath, content ? `${content}\n` : '', 'utf8');
}

function sanitizePhone(phone) {
  return String(phone || '').replace(/[^\d+]/g, '');
}

function matchPhone(entry, phone) {
  const input = sanitizePhone(phone);
  if (!input) return false;
  const entryPhone = sanitizePhone(entry?.person?.phone || '');
  return entryPhone === input;
}

function retentionCutoffDate(retentionDays) {
  const days = Number(retentionDays) || 365;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return cutoff;
}

function cleanupExpiredConsentLogs(retentionDays) {
  const entries = readJsonLines(CONSENT_LOG_FILE);
  if (entries.length === 0) {
    return { total: 0, removed: 0, kept: 0 };
  }

  const cutoff = retentionCutoffDate(retentionDays);
  const kept = entries.filter((entry) => {
    const createdAt = new Date(entry.createdAt || 0);
    return createdAt >= cutoff;
  });

  const removed = entries.length - kept.length;
  if (removed > 0) {
    writeJsonLines(CONSENT_LOG_FILE, kept);
  }

  return {
    total: entries.length,
    removed,
    kept: kept.length,
    cutoff: cutoff.toISOString(),
  };
}

module.exports = {
  CONSENT_LOG_FILE,
  AUDIT_LOG_FILE,
  appendConsentLog,
  appendAuditLog,
  readJsonLines,
  writeJsonLines,
  matchPhone,
  cleanupExpiredConsentLogs,
};
