const {
  cleanupExpiredConsentLogs,
  appendAuditLog,
} = require('../utils/pd-journal');

function runConsentRetentionJob() {
  const retentionDays = process.env.CONSENT_RETENTION_DAYS || '365';
  const result = cleanupExpiredConsentLogs(retentionDays);

  if ((result.removed || 0) > 0) {
    appendAuditLog({
      type: 'pd_retention_cleanup',
      createdAt: new Date().toISOString(),
      retentionDays: Number(retentionDays),
      removedCount: result.removed,
      keptCount: result.kept,
      cutoff: result.cutoff,
    });
  }

  return result;
}

function startConsentRetentionScheduler() {
  const intervalHours = Number(process.env.CONSENT_CLEANUP_INTERVAL_HOURS || 24);
  const intervalMs = Math.max(1, intervalHours) * 60 * 60 * 1000;

  runConsentRetentionJob();
  setInterval(runConsentRetentionJob, intervalMs);
}

module.exports = {
  runConsentRetentionJob,
  startConsentRetentionScheduler,
};
