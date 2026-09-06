import { useLanguage } from '../../context/LanguageContext.jsx';

export function LanguageSelector({ compact = false }) {
  const { language, changeLanguage, languages } = useLanguage();

  if (compact) {
    return (
      <div role="group" aria-label="Language selector" style={{
        display: 'inline-flex', alignItems: 'center', gap: 2,
        background: 'var(--color-surface)', border: '1.5px solid var(--color-border-teal)',
        borderRadius: 'var(--radius-full)', padding: 2,
      }}>
        {languages.map((lang) => {
          const active = language === lang.code;
          return (
            <button key={lang.code} onClick={() => changeLanguage(lang.code)}
              aria-pressed={active} aria-label={`Switch to ${lang.label}`}
              style={{
                minHeight: 36, minWidth: 44, padding: '4px 10px',
                borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer',
                fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)',
                background: active ? 'var(--color-primary)' : 'transparent',
                color: active ? '#fff' : 'var(--color-primary)',
                transition: 'all var(--transition-fast)',
              }}>
              {lang.code === 'en' ? 'EN' : 'हि'}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <select value={language} onChange={(e) => changeLanguage(e.target.value)}
      aria-label="Select language"
      style={{
        appearance: 'none', background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border-teal)', borderRadius: 'var(--radius-md)',
        padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-sm)',
        fontWeight: 'var(--weight-medium)', color: 'var(--color-text)', cursor: 'pointer',
        minHeight: 40,
      }}>
      {languages.map((l) => (
        <option key={l.code} value={l.code}>{l.nativeLabel} ({l.label})</option>
      ))}
    </select>
  );
}
