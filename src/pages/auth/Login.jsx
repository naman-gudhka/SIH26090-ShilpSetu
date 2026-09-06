import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { LanguageSelector } from '../../components/shared/LanguageSelector.jsx';
import { isValidEmail, normalizeEmail } from '../../services/authService.js';

const card = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 16,
  boxShadow: '0 4px 24px rgba(15,118,110,0.08)',
  padding: '2rem 1.75rem',
  width: '100%',
  maxWidth: 400,
};

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    if (!password) {
      setError(t('auth.errPasswordRequired'));
      return;
    }
    setLoading(true);
    try {
      const result = await login(cleanEmail, password);
      const role = result?.role || 'artisan';
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'buyer') {
        navigate('/buyer');
      } else if (role === 'artisan') {
        navigate('/artisan');
      } else {
        navigate('/select-role');
      }
    } catch (err) {
      setError(err.message || 'Incorrect email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', boxSizing: 'border-box' }}>
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/icons/icon-192.png" alt="ShilpSetu" width={36} height={36} style={{ borderRadius: 10 }} />
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>ShilpSetu</span>
          </div>
          <LanguageSelector compact />
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', textAlign: 'center', marginBottom: 4 }}>
          {t('auth.welcomeBack')}
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: 24 }}>
          {t('auth.signInSubtitle')}
        </p>

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="login-email" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>
              {t('auth.email')}
            </label>
            <input
              id="login-email"
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="login-password" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>
              {t('auth.password')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t('auth.password')}
                disabled={loading}
                style={{ padding: '0.75rem 3rem 0.75rem 1rem', borderRadius: 10, border: '1.5px solid var(--color-border)', background: 'var(--color-bg)', fontSize: '1rem', color: 'var(--color-text)', minHeight: 48, width: '100%', boxSizing: 'border-box' }}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', padding: 4 }}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'right', marginTop: -8 }}>
            <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
              {t('auth.forgotPassword')}
            </Link>
          </div>

          {error && (
            <div role="alert" style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#B91C1C' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '0.875rem', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 12, fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? <><Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> {t('auth.signingIn')}</> : t('actions.signIn')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          {t('auth.dontHaveAccount')}{' '}
          <Link to="/signup" style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}>
            {t('auth.createOne')}
          </Link>
        </p>
      </div>
    </main>
  );
}
