import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Paintbrush, ShoppingBag, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { LanguageSelector } from '../../components/shared/LanguageSelector.jsx';

export function ChoosePanel() {
  const navigate = useNavigate();
  const { availableRoles, activeRole, setActiveRole, logout } = useAuth();
  const { t } = useLanguage();
  const [selectedRole, setSelectedRole] = useState(() => activeRole || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const allPanels = [
    {
      role: 'artisan',
      label: t('panel.artisanTitle'),
      desc: t('panel.artisanDesc'),
      Icon: Paintbrush,
      color: 'var(--color-primary)',
      bg: '#F0FDFA',
      border: 'var(--color-primary)',
      path: '/artisan',
    },
    {
      role: 'buyer',
      label: t('panel.buyerTitle'),
      desc: t('panel.buyerDesc'),
      Icon: ShoppingBag,
      color: 'var(--color-secondary)',
      bg: '#FFF5F1',
      border: 'var(--color-secondary)',
      path: '/buyer',
    },
    {
      role: 'admin',
      label: t('panel.adminTitle'),
      desc: t('panel.adminDesc'),
      Icon: ShieldCheck,
      color: '#0F766E',
      bg: '#F8FAFC',
      border: '#0F766E',
      path: '/admin',
    },
  ];

  // If user has zero assigned roles, redirect to initial setup
  useEffect(() => {
    if (availableRoles && availableRoles.length === 0) {
      navigate('/select-role', { replace: true });
    }
  }, [availableRoles, navigate]);

  const roles = (availableRoles && availableRoles.length > 0)
    ? availableRoles
    : (activeRole ? [activeRole] : []);

  // Filter panels strictly to authorized availableRoles
  const authorizedPanels = allPanels.filter((p) => roles.includes(p.role));

  const handleSelect = async (role) => {
    setError('');
    // Strict client-side verification against authorized availableRoles
    if (!roles.includes(role)) {
      setError(`Unauthorized: You do not have permission to access the ${role} panel.`);
      return;
    }

    setLoading(true);
    try {
      await setActiveRole(role);
      const targetPanel = authorizedPanels.find((p) => p.role === role);
      navigate(targetPanel ? targetPanel.path : `/${role}`);
    } catch (err) {
      setError(err?.message || 'Failed to switch panel. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: 'var(--color-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2rem 1.25rem 2rem',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 680,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="ShilpSetu" width={36} height={36} style={{ borderRadius: 10 }} />
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>ShilpSetu</span>
        </div>
        <LanguageSelector compact />
      </div>

      <div style={{ textAlign: 'center', marginBottom: 32, maxWidth: 520 }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
          {t('panel.chooseWorkspace')}
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--color-text-muted)', margin: 0 }}>
          {t('panel.chooseSubtitle')}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: 12,
            padding: '0.75rem 1.25rem',
            fontSize: '0.875rem',
            color: '#B91C1C',
            marginBottom: 20,
            maxWidth: 680,
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {error}
        </div>
      )}

      <div
        role="radiogroup"
        aria-label={t('panel.chooseWorkspace')}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: 16,
          width: '100%',
          maxWidth: 680,
          marginBottom: 28,
        }}
      >
        {authorizedPanels.map(({ role, label, desc, Icon, color, bg, border }) => {
          const isCurrentActive = activeRole === role;
          const isSelected = selectedRole === role;

          return (
            <div
              key={role}
              onClick={() => setSelectedRole(role)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedRole(role); }}
              style={{
                background: isSelected ? bg : 'var(--color-surface)',
                border: `2px solid ${isSelected ? border : 'var(--color-border)'}`,
                borderRadius: 16,
                padding: '1.5rem',
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                boxShadow: isSelected ? `0 0 0 4px ${bg}` : '0 2px 8px rgba(0,0,0,0.03)',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 12,
                    background: bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={32} color={color} strokeWidth={1.75} aria-hidden="true" />
                </div>
                {isCurrentActive && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: color,
                      background: 'var(--color-surface)',
                      border: `1px solid ${color}`,
                      borderRadius: 99,
                      padding: '2px 8px',
                    }}
                  >
                    {t('panel.currentActive')}
                  </span>
                )}
              </div>

              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px 0' }}>
                  {label}
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
                  {desc}
                </p>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(role);
                  }}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem',
                    background: isSelected ? color : 'var(--color-surface)',
                    color: isSelected ? '#fff' : color,
                    border: `1.5px solid ${color}`,
                    borderRadius: 10,
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'all 0.15s',
                  }}
                >
                  {loading && selectedRole === role ? (
                    <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
                  ) : (
                    <>
                      {t('panel.enter')} {label.split(' ')[0]}
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
        <button
          type="button"
          onClick={logout}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '0.875rem',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            fontWeight: 600,
            textDecoration: 'underline',
          }}
        >
          {t('actions.signOut')}
        </button>
      </div>
    </main>
  );
}
