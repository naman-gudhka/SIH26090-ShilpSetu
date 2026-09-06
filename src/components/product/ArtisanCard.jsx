import { useNavigate } from 'react-router-dom';
import { MapPin, Star, BadgeCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';

function VerificationIndicator({ verified, labelVerified, labelUnverified }) {
  if (verified) {
    return (
      <BadgeCheck
        size={14}
        style={{ color: 'var(--color-primary)', flexShrink: 0 }}
        aria-label={labelVerified}
        title={labelVerified}
      />
    );
  }
  return (
    <span
      style={{
        fontSize: '10px',
        color: 'var(--color-warning)',
        fontWeight: 'var(--weight-semibold)',
        flexShrink: 0,
      }}
      title={labelUnverified}
      aria-label={labelUnverified}
    >
      •
    </span>
  );
}

/**
 * ArtisanCard — reusable artisan tile for buyer-facing sections.
 * Props:
 *   artisan  — artisan object from mockData
 *   compact  — (bool) narrower card for horizontal scroll rows
 *   onClick  — optional override click handler
 */
export function ArtisanCard({ artisan, compact = false, onClick }) {
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  if (!artisan) return null;

  const handleClick = () => {
    if (onClick) return onClick(artisan);
    navigate(`/buyer/artisans/${artisan.id}`);
  };

  // Stable avatar color per artisan id
  const avatarColors = {
    a1: '#0F766E',
    a2: '#C2542E',
    a3: '#8B5E3C',
    a4: '#2D7A3E',
    a5: '#1D4ED8',
  };
  const avatarColor = avatarColors[artisan.id] || '#0F766E';
  const initial = artisan.name?.charAt(0) || '?';

  return (
    <article
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`View ${artisan.name}'s artisan story`}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: compact ? 'var(--space-4)' : 'var(--space-6)',
        cursor: 'pointer',
        transition: 'box-shadow var(--transition-base), transform var(--transition-base)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-3)',
        minWidth: compact ? '160px' : undefined,
        maxWidth: compact ? '180px' : undefined,
        textAlign: 'center',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Avatar */}
      <div
        aria-hidden="true"
        style={{
          width: compact ? 56 : 72,
          height: compact ? 56 : 72,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${avatarColor}22, ${avatarColor}55)`,
          border: `2px solid ${avatarColor}55`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: compact ? 'var(--text-xl)' : 'var(--text-2xl)',
          fontWeight: 'var(--weight-bold)',
          color: avatarColor,
          flexShrink: 0,
        }}
      >
        {initial}
      </div>

      {/* Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-1)' }}>
          <span
            style={{
              fontSize: compact ? 'var(--text-sm)' : 'var(--text-base)',
              fontWeight: 'var(--weight-semibold)',
              color: 'var(--color-text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: compact ? '120px' : undefined,
            }}
          >
            {artisan.name}
          </span>
          <VerificationIndicator
            verified={artisan.verified}
            labelVerified={t('admin.verified')}
            labelUnverified={t('admin.unverified')}
          />
        </div>

        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {artisan.craft}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-1)' }}>
          <MapPin size={11} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} aria-hidden="true" />
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            {artisan.state}
          </span>
        </div>

        {!compact && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-1)',
              marginTop: 'var(--space-1)',
            }}
          >
            <Star size={13} style={{ color: '#F59E0B', fill: '#F59E0B' }} aria-hidden="true" />
            <span
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-semibold)',
                color: 'var(--color-text)',
              }}
            >
              {artisan.rating}
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              ({artisan.totalOrders} {language === 'hi' ? 'ऑर्डर' : 'orders'})
            </span>
          </div>
        )}
      </div>
    </article>
  );
}
