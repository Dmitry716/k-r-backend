const express = require('express');
const { requireAdmin } = require('../middleware/requireAdmin');
const {
  CONSENT_LOG_FILE,
  readJsonLines,
  writeJsonLines,
  matchPhone,
  appendAuditLog,
} = require('../utils/pd-journal');

const router = express.Router();

function parseDate(value) {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function inDateRange(entry, fromDate, toDate) {
  if (!fromDate && !toDate) return true;
  const createdAt = parseDate(entry?.createdAt);
  if (!createdAt) return false;
  if (fromDate && createdAt < fromDate) return false;
  if (toDate && createdAt > toDate) return false;
  return true;
}

function getRequesterIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || 'unknown';
}

router.get('/export', requireAdmin, (req, res) => {
  const { phone, from, to } = req.query;
  if (!phone) {
    return res.status(400).json({ success: false, message: 'Укажите phone' });
  }

  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  if ((from && !fromDate) || (to && !toDate)) {
    return res.status(400).json({ success: false, message: 'Некорректный формат даты from/to' });
  }

  const allEntries = readJsonLines(CONSENT_LOG_FILE);
  const matches = allEntries.filter(
    (entry) => matchPhone(entry, phone) && inDateRange(entry, fromDate, toDate)
  );

  appendAuditLog({
    type: 'pd_export_request',
    createdAt: new Date().toISOString(),
    targetPhone: String(phone),
    dateFrom: from ? String(from) : null,
    dateTo: to ? String(to) : null,
    requestedBy: req.admin?.email || req.admin?.username || req.admin?.id,
    requesterIp: getRequesterIp(req),
    resultsCount: matches.length,
  });

  return res.json({
    success: true,
    phone: String(phone),
    count: matches.length,
    data: matches,
  });
});

router.delete('/delete', requireAdmin, (req, res) => {
  const { phone, from, to } = req.body || {};
  if (!phone) {
    return res.status(400).json({ success: false, message: 'Укажите phone' });
  }

  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  if ((from && !fromDate) || (to && !toDate)) {
    return res.status(400).json({ success: false, message: 'Некорректный формат даты from/to' });
  }

  const allEntries = readJsonLines(CONSENT_LOG_FILE);
  const keptEntries = allEntries.filter(
    (entry) => !(matchPhone(entry, phone) && inDateRange(entry, fromDate, toDate))
  );
  const removed = allEntries.length - keptEntries.length;

  if (removed > 0) {
    writeJsonLines(CONSENT_LOG_FILE, keptEntries);
  }

  appendAuditLog({
    type: 'pd_delete_request',
    createdAt: new Date().toISOString(),
    targetPhone: String(phone),
    dateFrom: from ? String(from) : null,
    dateTo: to ? String(to) : null,
    requestedBy: req.admin?.email || req.admin?.username || req.admin?.id,
    requesterIp: getRequesterIp(req),
    removedCount: removed,
  });

  return res.json({
    success: true,
    phone: String(phone),
    removed,
  });
});

module.exports = router;
