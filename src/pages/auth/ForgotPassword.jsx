import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { LanguageSelector } from '../../components/shared/LanguageSelector.jsx';
import { isValidEmail, normalizeEmail } from '../../services/authService.js';

export function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail) {
      setError(t('auth.errEmailRequired'));
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      setError(t('auth.errEmailInvalid'));
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(cleanEmail);
      setEmail(cleanEmail);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', boxSizing: 'border-box' }}>
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, boxShadow: '0 4px 24px rgba(15,118,110,0.08)', padding: '2rem 1.75rem', width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="ShilpSetu" width={36} height={36} style={{ borderRadius: 10 }} />
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>ShilpSetu</span>
          </div>
          <LanguageSelector compact />
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', textAlign: 'center', marginBottom: 6 }}>
          {t('auth.resetPassword')}
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: 28, lineHeight: 1.5 }}>
          {t('auth.resetSubtitle')}
        </p>

        {sent ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12 }}>
            <CheckCircle2 size={52} color="#16A34A" />
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#166534' }}>
              {t('auth.checkInbox')}
            </p>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              {t('auth.resetLinkSent')} <strong>{email}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="fp-email" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>
                {t('auth.email')}
              </label>
              <input
                id="fp-email"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={e => setEmail(normalizeEmail(e.target.value))}
                placeholder="you@example.com"
                disabled={loading}
                style={{ padding: '0.75rem 1rem', borderRadius: 10, border: '1.5px solid var(--color-border)', background: 'var(--color-bg)', fontSize: '1rem', color: 'var(--color-text)', minHeight: 48, width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            {error && (
              <div role="alert" style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '0.75rem', fontSize: '0.875rem', color: '#B91C1C' }}>
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '0.875rem', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 12, fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? <><Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> {t('auth.sending')}</> : t('auth.sendResetLink')}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/login" style={{ fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
            {t('auth.backToSignIn')}
          </Link>
        </div>
      </div>
    </main>
  );
}
