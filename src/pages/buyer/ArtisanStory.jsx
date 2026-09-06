import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Package, ShoppingBag, Share2, Check } from 'lucide-react';
import { artisans as initialArtisans, products as initialProducts } from '../../data/mockData.js';
import { artisanService } from '../../services/artisanService.js';
import { productService } from '../../services/productService.js';
import { ProductCard } from '../../components/product/ProductCard.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

function VerificationPill({ verified, labelVerified, labelUnverified }) {
  if (verified) {
    return <span className="badge badge-success">{labelVerified}</span>;
  }
  return <span className="badge badge-warning">{labelUnverified}</span>;
}

/** Stable avatar colors mapped by artisan id */
const AVATAR_COLORS = {
  a1: { bg: 'linear-gradient(135deg, #CCFBF1, #99F6E4)', border: '#5EEAD4', text: '#0F766E' },
  a2: { bg: 'linear-gradient(135deg, #FED7C3, #FDBA8C)', border: '#FB923C', text: '#C2542E' },
  a3: { bg: 'linear-gradient(135deg, #FDF0E6, #F5DFC5)', border: '#D4A574', text: '#8B5E3C' },
  a4: { bg: 'linear-gradient(135deg, #DCFCE7, #BBF7D0)', border: '#6EE7B7', text: '#2D7A3E' },
  a5: { bg: 'linear-gradient(135deg, #DBEAFE, #BFDBFE)', border: '#93C5FD', text: '#1D4ED8' },
};

export function ArtisanStory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, isHindi } = useLanguage();

  const [artisan, setArtisan] = useState(() => initialArtisans.find((a) => a.id === id) || null);
  const [artisanProducts, setArtisanProducts] = useState(() =>
    initialProducts.filter((p) => p.artisanId === id && p.status === 'published')
  );
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/buyer/artisans/${artisan?.id || id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: artisan?.name || 'Artisan Story',
          text: `Discover authentic handmade crafts by ${artisan?.name || 'this artisan'} on ShilpSetu:`,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Silently ignore clipboard write errors
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const art = await artisanService.getArtisanById(id);
        if (isMounted && art) {
          setArtisan(art);
        }
        const prods = await productService.getProductsByArtisan(id);
        if (isMounted && prods) {
          setArtisanProducts(prods.filter((p) => p.status === 'published'));
        }
      } catch {
        // Fallback to initial
      }
    }
    loadData();

    const handleArtisansChanged = (e) => {
      const { id: changedId, artisan: updatedArt, updates } = e.detail || {};
      if (changedId === id && isMounted) {
        setArtisan((prev) => (updatedArt ? { ...prev, ...updatedArt } : { ...prev, ...updates }));
      }
    };
    window.addEventListener('shilpsetu_artisans_changed', handleArtisansChanged);

    return () => {
      isMounted = false;
      window.removeEventListener('shilpsetu_artisans_changed', handleArtisansChanged);
    };
  }, [id]);

  /* ── Not found state ── */
  if (!artisan) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60dvh',
          padding: 'var(--space-8)',
          textAlign: 'center',
          gap: 'var(--space-4)',
        }}
      >
        <Package size={48} style={{ color: 'var(--color-text-muted)', opacity: 0.4 }} aria-hidden="true" />
        <h2 style={{ color: 'var(--color-text)' }}>{t('buyer.artisanNotFound')}</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>
          {t('buyer.artisanNotFoundDesc')}
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/buyer')}>
          {t('buyer.goHome')}
        </button>
      </div>
    );
  }

  const colors = AVATAR_COLORS[artisan.id] || AVATAR_COLORS.a1;

  return (
    <div
      className="page page-with-bottom-nav"
      style={{ background: 'var(--color-bg)', padding: 0 }}
    >
      {/* ── Back button & Share button ── */}
      <div
        style={{
          padding: 'var(--space-3) var(--page-padding)',
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="btn btn-ghost btn-sm"
          aria-label={t('actions.back')}
          style={{ paddingLeft: 0 }}
        >
          <ArrowLeft size={18} aria-hidden="true" />
          {t('actions.back')}
        </button>

        <button
          onClick={handleShare}
          aria-label={copied ? (t('artisan.linkCopied') || 'Link Copied!') : (t('actions.share') || 'Share')}
          style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            border: copied ? '1px solid var(--color-success)' : '1px solid var(--color-border)',
            background: copied ? 'var(--color-success-bg)' : 'var(--color-surface)',
            color: copied ? 'var(--color-success)' : 'var(--color-text)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            transition: 'all 0.15s ease',
          }}
        >
          {copied ? (
            <>
              <Check size={14} color="var(--color-success)" />
              <span>{t('artisan.linkCopied') || 'Link Copied!'}</span>
            </>
          ) : (
            <>
              <Share2 size={14} />
              <span>{t('actions.share') || 'Share'}</span>
            </>
          )}
        </button>
      </div>

      {/* ── Hero ── */}
      <div
        style={{
          background: 'linear-gradient(160deg, #FDF6EC 0%, #F0FDFB 100%)',
          padding: 'var(--space-8) var(--page-padding)',
          borderBottom: '1px solid var(--color-border)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circle */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.border}33 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 'var(--space-4)', position: 'relative', zIndex: 1 }}>
          {/* Large avatar */}
          <div
            aria-hidden="true"
            style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              background: colors.bg,
              border: `3px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--text-display)',
              fontWeight: 'var(--weight-bold)',
              color: colors.text,
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {artisan.name.charAt(0)}
          </div>

          {/* Name + badges */}
          <div>
            <h1 style={{ fontSize: 'var(--text-2xl)', color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>
              {artisan.name}
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', justifyContent: 'center', marginBottom: 'var(--space-2)' }}>
              <span className="badge badge-primary">{artisan.craft}</span>
              {artisan.verified ? (
                <span className="badge badge-success">{t('buyer.verifiedArtisan')}</span>
              ) : (
                <span className="badge badge-warning">{t('buyer.unverifiedArtisan')}</span>
              )}
              <VerificationPill
                verified={artisan.verified}
                labelVerified={t('buyer.verifiedArtisan')}
                labelUnverified={t('buyer.unverifiedArtisan')}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', justifyContent: 'center' }}>
              <MapPin size={14} style={{ color: 'var(--color-text-muted)' }} aria-hidden="true" />
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                {artisan.village || artisan.city}, {artisan.state}
              </span>
            </div>
            <p
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-muted)',
                marginTop: 'var(--space-2)',
              }}
            >
              {artisan.experience} {t('buyer.experienceOf')}
            </p>
          </div>

          {/* Bio */}
          {artisan.bio && (
            <p
              style={{
                fontSize: 'var(--text-base)',
                color: 'var(--color-text)',
                lineHeight: 1.75,
                maxWidth: '560px',
                fontStyle: 'italic',
              }}
            >
              "{isHindi && artisan.bioHindi ? artisan.bioHindi : artisan.bio}"
            </p>
          )}
        </div>
      </div>

      {/* ── Stats row ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
        }}
        role="list"
        aria-label="Artisan statistics"
      >
        {[
          { label: t('buyer.published'), value: artisanProducts.length || artisan.published || 0, icon: <ShoppingBag size={16} style={{ color: 'var(--color-primary)' }} aria-hidden="true" /> },
          {
            label: t('buyer.rating'),
            value: (
              <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <Star size={14} style={{ color: '#F59E0B', fill: '#F59E0B' }} aria-hidden="true" />
                {artisan.rating || '4.8'}
              </span>
            ),
            icon: null,
          },
          { label: t('buyer.totalOrders'), value: artisan.totalOrders || 24, icon: null },
        ].map((stat) => (
          <div
            key={stat.label}
            role="listitem"
            style={{
              padding: 'var(--space-5) var(--space-2)',
              textAlign: 'center',
              borderRight: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-1)',
            }}
          >
            <div
              style={{
                fontSize: 'var(--text-xl)',
                fontWeight: 'var(--weight-bold)',
                color: 'var(--color-text)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-1)',
                justifyContent: 'center',
              }}
            >
              {stat.value}
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Products section ── */}
      <div style={{ padding: 'var(--space-6) var(--page-padding)' }}>
        <h2
          style={{
            fontSize: 'var(--text-xl)',
            color: 'var(--color-text)',
            marginBottom: 'var(--space-4)',
          }}
        >
          {isHindi ? `${artisan.name} द्वारा उत्पाद` : `${t('buyer.productsBy')} ${artisan.name?.split(' ')[0]}`}
        </h2>

        {artisanProducts.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-4)',
              padding: 'var(--space-12) var(--space-4)',
              textAlign: 'center',
            }}
            role="status"
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--color-border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-hidden="true"
            >
              <Package size={28} style={{ color: 'var(--color-text-muted)' }} />
            </div>
            <div>
              <p style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>
                {t('artisan.noPublishedProducts')}
              </p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
                {t('artisan.noPublishedProductsDesc')}
              </p>
            </div>
          </div>
        ) : (
          <div
            role="list"
            aria-label={`Products by ${artisan.name}`}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 'var(--space-4)',
            }}
          >
            {artisanProducts.map((product) => (
              <div key={product.id} role="listitem">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Languages note */}
      {artisan.languages?.length > 0 && (
        <div
          style={{
            margin: '0 var(--page-padding) var(--space-8)',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
          }}
        >
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            <strong style={{ color: 'var(--color-text)' }}>{isHindi ? 'भाषाएँ: ' : 'Languages: '}</strong>
            {artisan.languages.join(', ')}
          </p>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          [aria-label^="Products by"] {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
