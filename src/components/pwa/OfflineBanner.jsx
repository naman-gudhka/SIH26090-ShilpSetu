import { useEffect, useRef, useState } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

const CONFIG = {
  offline: {
    bg: '#FEF3C7',
    border: '#FDE68A',
    color: '#92400E',
    Icon: WifiOff,
    msgKey: 'pwa.offlineBanner',
    spin: false,
    retry: false,
  },
  restored: {
    bg: 'var(--color-surface-teal)',
    border: 'var(--color-border-teal)',
    color: 'var(--color-primary)',
    Icon: Wifi,
    msgKey: 'pwa.connectionRestored',
    spin: false,
    retry: false,
  },
  syncing: {
    bg: 'var(--color-primary-light)',
    border: 'var(--color-border-teal)',
    color: 'var(--color-primary)',
    Icon: RefreshCw,
    msgKey: 'pwa.syncingBanner',
    spin: true,
    retry: false,
  },
  complete: {
    bg: 'var(--color-success-bg)',
    border: '#A7F3D0',
    color: 'var(--color-success)',
    Icon: CheckCircle,
    msgKey: 'pwa.syncedBanner',
    spin: false,
    retry: false,
  },
  failed: {
    bg: 'var(--color-error-bg)',
    border: '#FECACA',
    color: 'var(--color-error)',
    Icon: AlertCircle,
    msgKey: 'pwa.syncFailed',
    spin: false,
    retry: true,
  },
};

/**
 * Derive which banner state to show directly from network context values.
 * Returns null for hidden states.
 */
function getBannerKey(isOnline, wasOffline, syncStatus, SYNC_STATUS) {
  if (!isOnline) return 'offline';
  if (syncStatus === SYNC_STATUS.SYNCING) return 'syncing';
  if (syncStatus === SYNC_STATUS.SYNC_FAILED) return 'failed';
  if (syncStatus === SYNC_STATUS.SYNC_COMPLETE) return 'complete';
  if (wasOffline && isOnline) return 'restored';

  return null;
}

export function OfflineBanner() {
  const {
    isOnline,
    wasOffline,
    syncStatus,
    retrySycn,
    SYNC_STATUS,
  } = useNetwork();
  const { t } = useLanguage();

  const [fadeOut, setFadeOut] = useState(false);
  const bannerKey = getBannerKey(
    isOnline,
    wasOffline,
    syncStatus,
    SYNC_STATUS
  );
  const [prevBannerKey, setPrevBannerKey] = useState(bannerKey);

  if (bannerKey !== prevBannerKey) {
    setPrevBannerKey(bannerKey);
    setFadeOut(false);
  }

  const bannerRef = useRef(null);
  const timerRef = useRef(null);

  // Auto-hide transient states after 3 seconds.
  useEffect(() => {
    const el = bannerRef.current;

    if (!el) return undefined;

    clearTimeout(timerRef.current);

    if (bannerKey === 'complete' || bannerKey === 'restored') {
      el.style.opacity = '1';

      timerRef.current = window.setTimeout(() => {
        setFadeOut(true);
        el.style.opacity = '0';
      }, 3000);
    } else {
      el.style.opacity = bannerKey ? '1' : '0';
    }

    return () => {
      clearTimeout(timerRef.current);
    };
  }, [bannerKey]);

  if (!bannerKey || fadeOut) return null;

  const cfg = CONFIG[bannerKey];

  if (!cfg) return null;

  const {
    bg,
    border,
    color,
    Icon,
    msgKey,
    spin,
    retry,
  } = cfg;

  return (
    <div
      ref={bannerRef}
      role="status"
      aria-live="polite"
      style={{
        width: '100%',
        background: bg,
        borderBottom: `1px solid ${border}`,
        color,
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--weight-medium)',
        zIndex: 1000,
        opacity: 1,
        transition: 'opacity 0.5s ease',
      }}
    >
      <Icon
        size={16}
        strokeWidth={2}
        aria-hidden="true"
        style={{
          animation: spin ? 'spin 1s linear infinite' : 'none',
          flexShrink: 0,
        }}
      />

      <span>{t(msgKey)}</span>

      {retry && (
        <button
          onClick={retrySycn}
          style={{
            marginLeft: 8,
            padding: '3px 10px',
            borderRadius: 'var(--radius-sm)',
            border: `1.5px solid ${color}`,
            background: 'transparent',
            color,
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-semibold)',
            cursor: 'pointer',
          }}
        >
          {t('artisan.tryAgain')}
        </button>
      )}
    </div>
  );
}