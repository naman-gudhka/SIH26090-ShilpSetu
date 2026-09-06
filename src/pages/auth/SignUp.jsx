import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { LanguageSelector } from '../../components/shared/LanguageSelector.jsx';
import { isValidEmail, normalizeEmail } from '../../services/authService.js';

const cardStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 16,
  boxShadow: '0 4px 24px rgba(15,118,110,0.08)',
  padding: '2rem 1.75rem',
  width: '100%',
  maxWidth: 400,
};
const inputStyle = {
  padding: '0.75rem 1rem',
  borderRadius: 10,
  border: '1.5px solid var(--color-border)',
  background: 'var(--color-bg)',
  fontSize: '1rem',
  color: 'var(--color-text)',
  minHeight: 48,
  width: '100%',
  boxSizing: 'border-box',
};
const labelStyle = { fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' };

export function SignUp() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) {
      setError(t('auth.errNameRequired'));
      return;
    }
    const cleanEmail = normalizeEmail(form.email);
    if (!cleanEmail) {
      setError(t('auth.errEmailRequired'));
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      setError(t('auth.errEmailInvalid'));
      return;
    }
    if (form.password.length < 8) {
      setError(t('auth.errPasswordLength'));
      return;
    }
    if (form.password !== form.confirm) {
      setError(t('auth.errPasswordMatch'));
      return;
    }
    setLoading(true);
    try {
      await signup(cleanEmail, form.password, form.name.trim());
      navigate('/select-role');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', boxSizing: 'border-box' }}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="ShilpSetu" width={36} height={36} style={{ borderRadius: 10 }} />
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>ShilpSetu</span>
          </div>
          <LanguageSelector compact />
        </div>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-text)', textAlign: 'center', marginBottom: 4 }}>
          {t('auth.createAccount')}
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: 24 }}>
          {t('auth.signUpSubtitle')}
        </p>

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="su-name" style={labelStyle}>
              {t('auth.fullName')}
            </label>
            <input
              id="su-name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={set('name')}
              placeholder={t('auth.fullName')}
              disabled={loading}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="su-email" style={labelStyle}>
              {t('auth.email')}
            </label>
            <input
              id="su-email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              value={form.email}
              onChange={set('email')}
              onBlur={(e) =>
                setForm((p) => ({ ...p, email: normalizeEmail(e.target.value) }))
              }
              placeholder="you@example.com"
              disabled={loading}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="su-pw" style={labelStyle}>
              {t('auth.password')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="su-pw"
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.password}
                onChange={set('password')}
                disabled={loading}
                style={{ ...inputStyle, paddingRight: '3rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? 'Hide' : 'Show'}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              {t('auth.minCharacters')}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="su-cf" style={labelStyle}>
              {t('auth.confirmPassword')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="su-cf"
                type={showCf ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.confirm}
                onChange={set('confirm')}
                disabled={loading}
                style={{ ...inputStyle, paddingRight: '3rem' }}
              />
              <button
                type="button"
                onClick={() => setShowCf((v) => !v)}
                aria-label={showCf ? 'Hide' : 'Show'}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}
              >
                {showCf ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#B91C1C' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '0.875rem', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 12, fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1, marginTop: 4 }}
          >
            {loading ? <><Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> {t('auth.creatingAccount')}</> : t('actions.signUp')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          {t('auth.alreadyHaveAccount')}{' '}
          <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}>
            {t('auth.signInPrompt')}
          </Link>
        </p>
      </div>
    </main>
  );
}
