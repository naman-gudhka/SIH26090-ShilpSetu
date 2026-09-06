import { Download, Clock, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { SYNC_STATUS } from '../../services/offlineSyncService.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

const CONFIG = {
  [SYNC_STATUS.SAVED_LOCALLY]: { Icon: Download,     msgKey: 'pwa.savedLocally',     color: 'var(--color-success)', bg: 'var(--color-success-bg)', spin: false },
  [SYNC_STATUS.PENDING_SYNC]:  { Icon: Clock,        msgKey: 'pwa.pendingSync',      color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', spin: false },
  [SYNC_STATUS.SYNCING]:       { Icon: RefreshCw,    msgKey: 'pwa.syncing',          color: 'var(--color-primary)', bg: 'var(--color-primary-light)', spin: true },
  [SYNC_STATUS.SYNC_COMPLETE]: { Icon: CheckCircle2, msgKey: 'pwa.synced',           color: 'var(--color-success)', bg: 'var(--color-success-bg)', spin: false },
  [SYNC_STATUS.SYNC_FAILED]:   { Icon: XCircle,      msgKey: 'pwa.syncFailedShort',  color: 'var(--color-error)',   bg: 'var(--color-error-bg)', spin: false },
};

export function SyncStatus({ status, label }) {
  const { t } = useLanguage();
  const cfg = CONFIG[status];
  if (!cfg) return null;
  const { Icon, msgKey, color, bg, spin } = cfg;
  const displayLabel = label || t(msgKey);
  return (
    <span role="status" aria-live="polite" aria-label={`Sync: ${displayLabel}`} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px 3px 8px', borderRadius: 'var(--radius-full)',
      background: bg, color,
      fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)',
    }}>
      <Icon size={12} strokeWidth={2.5} aria-hidden="true"
        style={{ animation: spin ? 'spin 1s linear infinite' : 'none' }} />
      <span>{displayLabel}</span>
    </span>
  );
}
