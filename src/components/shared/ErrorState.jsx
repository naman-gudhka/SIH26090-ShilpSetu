import { AlertCircle, RefreshCcw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function ErrorState({ title, message, onRetry }) {
  const { t } = useLanguage();
  const displayTitle = title || t('artisan.aiError');
  const displayMessage = message || t('pwa.syncFailed');

  return (
    <div role="alert" aria-live="assertive" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', textAlign: 'center',
      padding: 'var(--space-12) var(--space-6)', gap: 'var(--space-4)',
    }}>
      <div aria-hidden="true" style={{
        width: 80, height: 80, borderRadius: 'var(--radius-full)',
        background: 'var(--color-error-bg)', border: '1.5px solid rgba(185,28,28,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <AlertCircle size={40} strokeWidth={1.5} style={{ color: 'var(--color-error)' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxWidth: 360 }}>
        <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>{displayTitle}</h3>
        <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{displayMessage}</p>
      </div>
      {onRetry && (
        <button className="btn btn-outline" onClick={onRetry} style={{ marginTop: 'var(--space-2)', display: 'flex', gap: 8 }}>
          <RefreshCcw size={16} aria-hidden="true" /> {t('artisan.tryAgain')}
        </button>
      )}
    </div>
  );
}
