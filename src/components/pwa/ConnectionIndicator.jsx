import { useNetwork } from '../../context/NetworkContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export function ConnectionIndicator() {
  const { isOnline, syncStatus, SYNC_STATUS } = useNetwork();
  const { t } = useLanguage();
  const isSyncing = syncStatus === SYNC_STATUS.SYNCING;

  let variant = isOnline ? 'online' : 'offline';
  if (isSyncing) variant = 'syncing';

  const config = {
    online:  { Icon: Wifi,      label: t('pwa.online'),   bg: 'var(--color-success-bg)',   color: 'var(--color-success)' },
    offline: { Icon: WifiOff,   label: t('pwa.offline'),  bg: 'var(--color-border-light)', color: 'var(--color-text-muted)' },
    syncing: { Icon: RefreshCw, label: t('pwa.syncing'),  bg: 'var(--color-primary-light)', color: 'var(--color-primary)' },
  };

  const { Icon, label, bg, color } = config[variant];

  return (
    <div role="status" aria-live="polite" aria-label={`Network: ${label}`} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 'var(--radius-full)',
      background: bg, color,
      fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0,
        animation: variant === 'syncing' ? 'pulse 1.5s ease infinite' : 'none',
      }} />
      <Icon size={12} strokeWidth={2.5} aria-hidden="true"
        style={{ animation: variant === 'syncing' ? 'spin 1s linear infinite' : 'none' }} />
      <span className="conn-label" style={{ display: 'none' }}>{label}</span>
      <style>{`@media (min-width: 640px) { .conn-label { display: inline !important; } }`}</style>
    </div>
  );
}
