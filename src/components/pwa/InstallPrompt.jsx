import { useState } from 'react';
import { X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function InstallPrompt() {
  const { isInstallable, isInstalled, isIOS, showBanner, install, dismissBanner } = usePWAInstall();
  const { t } = useLanguage();
  const [installing, setInstalling] = useState(false);

  if (isInstalled || !showBanner) return null;

  const handleInstall = async () => {
    setInstalling(true);
    await install();
    setInstalling(false);
  };

  const cardStyle = {
    position: 'fixed',
    bottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px) + 12px)',
    left: 12, right: 12,
    zIndex: 1100,
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    borderTop: '3px solid var(--color-primary)',
    boxShadow: 'var(--shadow-xl)',
    padding: 20,
    maxWidth: 480,
    margin: '0 auto',
    animation: 'slideUp 350ms ease forwards',
  };

  if (isInstallable) {
    return (
      <>
        <div className="install-prompt-card" role="dialog" aria-label={t('pwa.installTitle')} style={cardStyle}>
        <button onClick={dismissBanner} aria-label="Dismiss" style={{
          position: 'absolute', top: 12, right: 12, width: 32, height: 32,
          borderRadius: '50%', background: 'var(--color-border-light)',
          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--color-text-muted)',
        }}><X size={14} /></button>

        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
          <img src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="ShilpSetu" width={48} height={48}
            style={{ borderRadius: 12, border: '1px solid var(--color-border)', flexShrink: 0 }} />
          <div>
            <p style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', fontSize: 'var(--text-base)' }}>
              {t('pwa.installTitle')}
            </p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              {t('pwa.installSubtitle')}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleInstall} disabled={installing} style={{
            flex: 1, minHeight: 48, borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary)', color: '#fff', border: 'none',
            fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)', cursor: 'pointer',
          }}>
            {installing ? '…' : t('pwa.installApp')}
          </button>
          <button onClick={dismissBanner} style={{
            padding: '0 18px', minHeight: 48, borderRadius: 'var(--radius-md)',
            background: 'transparent', color: 'var(--color-text-muted)',
            border: '1.5px solid var(--color-border)', cursor: 'pointer', fontSize: 'var(--text-sm)',
          }}>
            {t('pwa.notNow')}
          </button>
        </div>
      </div>
      <style>{`
        @media (min-width: 1024px) {
          .install-prompt-card {
            bottom: 24px !important;
          }
        }
      `}</style>
      </>
    );
  }

  if (isIOS) {
    return (
      <>
      <div className="install-prompt-card" role="dialog" aria-label={t('pwa.addToHomeScreen')} style={cardStyle}>
        <button onClick={dismissBanner} aria-label={t('actions.close')} style={{
          position: 'absolute', top: 12, right: 12, width: 32, height: 32,
          borderRadius: '50%', background: 'var(--color-border-light)',
          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--color-text-muted)',
        }}><X size={14} /></button>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
          <img src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="ShilpSetu" width={40} height={40}
            style={{ borderRadius: 10, flexShrink: 0 }} />
          <div>
            <p style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>{t('pwa.installTitle')}</p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{t('pwa.installSubtitle')}</p>
          </div>
        </div>

        <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {[
            t('pwa.iosStep1'),
            t('pwa.iosStep2'),
            t('pwa.iosStep3'),
          ].map((step, i) => (
            <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{
                width: 22, height: 22, borderRadius: '50%',
                background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>{i + 1}</span>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', lineHeight: 1.5 }}>{step}</span>
            </li>
          ))}
        </ol>

        <button onClick={dismissBanner} style={{
          width: '100%', minHeight: 48, borderRadius: 'var(--radius-md)',
          background: 'var(--color-primary)', color: '#fff', border: 'none',
          fontWeight: 'var(--weight-semibold)', cursor: 'pointer',
        }}>{t('pwa.gotIt')}</button>
      </div>
      <style>{`
        @media (min-width: 1024px) {
          .install-prompt-card {
            bottom: 24px !important;
          }
        }
      `}</style>
      </>
    );
  }

  return null;
}
