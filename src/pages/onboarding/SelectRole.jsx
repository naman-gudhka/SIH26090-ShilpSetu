import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paintbrush,
  ShoppingBag,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { LanguageSelector } from '../../components/shared/LanguageSelector.jsx';

const PATHS = {
  artisan: '/onboarding/artisan',
  buyer: '/onboarding/customer',
};

export function SelectRole() {
  const navigate = useNavigate();
  const { availableRoles } = useAuth();
  const { t } = useLanguage();

  const [selected, setSelected] = useState(null);

  const rolesList = [
    {
      key: 'artisan',
      label: t('role.artisan'),
      desc: t('roleSelect.artisanDesc'),
      Icon: Paintbrush,
      color: 'var(--color-primary)',
      bg: '#F0FDFA',
      border: 'var(--color-primary)',
    },
    {
      key: 'buyer',
      label: t('role.customer'),
      desc: t('roleSelect.buyerDesc'),
      Icon: ShoppingBag,
      color: 'var(--color-secondary)',
      bg: '#FFF5F1',
      border: 'var(--color-secondary)',
    },
  ];

  // Existing authorized users must not use public role selection
  // to grant themselves another role.
  useEffect(() => {
    if (!availableRoles || availableRoles.length === 0) return;

    if (availableRoles.length > 1) {
      navigate('/choose-panel', { replace: true });
      return;
    }

    const role = availableRoles[0];

    if (role === 'artisan') {
      navigate('/artisan', { replace: true });
    } else if (role === 'buyer') {
      navigate('/buyer', { replace: true });
    } else if (role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [availableRoles, navigate]);

  const handleContinue = () => {
    if (!selected) return;

    // Prevent an already-authorized user from adding a role here.
    if (availableRoles && availableRoles.length > 0) return;

    navigate(PATHS[selected]);
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
          maxWidth: 880,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <img
            src={`${import.meta.env.BASE_URL}icons/icon-192.png`}
            alt="ShilpSetu"
            width={36}
            height={36}
            style={{ borderRadius: 10 }}
          />
          <span
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: 'var(--color-primary)',
            }}
          >
            ShilpSetu
          </span>
        </div>
        <LanguageSelector compact />
      </div>

      <div
        style={{
          textAlign: 'center',
          marginBottom: 32,
          maxWidth: 540,
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(1.5rem,5vw,2rem)',
            fontWeight: 700,
            color: 'var(--color-text)',
            marginBottom: 8,
          }}
        >
          {t('roleSelect.title')}
        </h1>

        <p
          style={{
            fontSize: '1rem',
            color: 'var(--color-text-muted)',
            margin: 0,
          }}
        >
          {t('roleSelect.subtitle')}
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label="Select your role"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))',
          gap: 16,
          width: '100%',
          maxWidth: 880,
          marginBottom: 32,
        }}
      >
        {rolesList.map(
          ({ key, label, desc, Icon, color, bg, border }) => {
            const isSelected = selected === key;

            return (
              <button
                key={key}
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelected(key)}
                style={{
                  background: isSelected
                    ? bg
                    : 'var(--color-surface)',
                  border: `2px solid ${
                    isSelected ? border : 'var(--color-border)'
                  }`,
                  borderRadius: 16,
                  padding: '1.5rem',
                  cursor: 'pointer',
                  position: 'relative',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  boxShadow: isSelected
                    ? `0 0 0 4px ${bg}`
                    : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {isSelected && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 14,
                      right: 14,
                    }}
                  >
                    <CheckCircle2
                      size={22}
                      color={color}
                    />
                  </span>
                )}

                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    background: bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon
                    size={40}
                    color={color}
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </div>

                <h2
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: 'var(--color-text)',
                    margin: 0,
                  }}
                >
                  {label}
                </h2>

                <p
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--color-text-muted)',
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {desc}
                </p>
              </button>
            );
          },
        )}
      </div>

      <button
        onClick={handleContinue}
        disabled={!selected}
        style={{
          padding: '1rem 2rem',
          background: 'var(--color-primary)',
          color: '#fff',
          border: 'none',
          borderRadius: 12,
          fontSize: '1.0625rem',
          fontWeight: 700,
          cursor: !selected ? 'not-allowed' : 'pointer',
          minHeight: 56,
          width: '100%',
          maxWidth: 880,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: !selected ? 0.45 : 1,
        }}
      >
        {t('roleSelect.continue')}
      </button>
    </main>
  );
}