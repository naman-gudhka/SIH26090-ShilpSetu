import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, ChevronRight, MapPin } from 'lucide-react';
import { featuredCrafts, regions, products as initialProducts, artisans as initialArtisans } from '../../data/mockData.js';
import { ProductCard } from '../../components/product/ProductCard.jsx';
import { ArtisanCard } from '../../components/product/ArtisanCard.jsx';
import { productService } from '../../services/productService.js';
import { artisanService } from '../../services/artisanService.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

/** Emoji icons mapped to craft names for the chip row */
const CRAFT_EMOJI = {
  Madhubani: '🎨',
  'Kutch Embroidery': '🧵',
  'Blue Pottery': '🏺',
  Kalamkari: '✍️',
  Dhokra: '🔔',
  Channapatna: '🪀',
};

/** Region color accents cycling */
const REGION_COLORS = [
  { bg: '#F0FDFB', border: '#B2D8D5', text: '#0F766E' },
  { bg: '#FDF9F5', border: '#E8C9B1', text: '#8B5E3C' },
  { bg: '#FFF7F0', border: '#F5C9B3', text: '#C2542E' },
  { bg: '#F0FDF4', border: '#BBF7D0', text: '#2D7A3E' },
];

export function BuyerHome() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState(() =>
    initialProducts.filter((p) => p.status === 'published').slice(0, 6)
  );
  const [artisanList, setArtisanList] = useState(initialArtisans);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [prods, arts] = await Promise.all([
          productService.getProducts({ status: 'published' }),
          artisanService.getArtisans(),
        ]);
        if (isMounted) {
          if (prods?.length) setFeaturedProducts(prods.slice(0, 6));
          if (arts?.length) setArtisanList(arts);
        }
      } catch {
        // Fallback
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/buyer/products?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/buyer/products');
    }
  };

  return (
    <div
      className="page page-with-bottom-nav buyer-home-container"
      style={{
        background: 'var(--color-bg)',
        padding: 0,
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      className="page page-with-bottom-nav"
      style={{ background: 'var(--color-bg)', padding: 0 }}
    >
      {/* ── Search bar ── */}
      <div
        style={{
          padding: 'var(--space-4) var(--page-padding) var(--space-2)',
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <form onSubmit={handleSearch} role="search" aria-label="Search products">
          <div style={{ position: 'relative', maxWidth: '600px', margin: '0 auto' }}>
            <Search
              size={18}
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 'var(--space-4)',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="search"
              className="form-input"
              placeholder={t('buyer.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search products"
              style={{ paddingLeft: '2.75rem', paddingRight: 'var(--space-4)', borderRadius: 'var(--radius-full)' }}
            />
          </div>
        </form>
      </div>

      {/* ── Hero Banner ── */}
      <section
        aria-label="Welcome hero"
        style={{
          background: 'linear-gradient(135deg, #FDF6EC 0%, #F0FDFB 50%, #FAF8F5 100%)',
          padding: 'var(--space-12) var(--page-padding)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative background shapes */}
        <div aria-hidden="true" style={{
          position: 'absolute', top: '-40px', right: '-40px',
          width: '280px', height: '280px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(15,118,110,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div aria-hidden="true" style={{
          position: 'absolute', bottom: '-30px', left: '-30px',
          width: '200px', height: '200px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(194,84,46,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '600px', position: 'relative', zIndex: 1 }}>
          <span className="badge badge-accent" style={{ marginBottom: 'var(--space-4)', display: 'inline-flex' }}>
            {t('buyer.heroBadge')}
          </span>
          <h1
            style={{
              fontSize: 'clamp(1.75rem, 5vw, 3rem)',
              fontWeight: 'var(--weight-bold)',
              color: 'var(--color-text)',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              marginBottom: 'var(--space-4)',
              whiteSpace: 'pre-line',
            }}
          >
            {t('buyer.heroTitle')}
          </h1>
          <p
            style={{
              fontSize: 'var(--text-lg)',
              color: 'var(--color-text-muted)',
              marginBottom: 'var(--space-8)',
              lineHeight: 1.6,
            }}
          >
            {t('buyer.heroSubtitle')}
          </p>
          <Link
            to="/buyer/products"
            className="btn btn-primary btn-lg"
            aria-label="Explore all handmade crafts"
          >
            {t('buyer.exploreCrafts')}
            <ChevronRight size={20} aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* ── Section 1: Explore by Craft ── */}
      <section aria-labelledby="crafts-heading" style={{ padding: 'var(--space-8) 0' }}>
        <div style={{ padding: '0 var(--page-padding)', marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 id="crafts-heading" style={{ fontSize: 'var(--text-xl)', color: 'var(--color-text)' }}>
              {t('buyer.exploreByCraft')}
            </h2>
            <Link
              to="/buyer/products"
              style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}
            >
              {t('buyer.seeAll')} <ChevronRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Horizontal scroll row */}
        <div
          role="list"
          aria-label="Craft categories"
          style={{
            display: 'flex',
            gap: 'var(--space-3)',
            overflowX: 'auto',
            padding: '0 var(--page-padding) var(--space-2)',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
          }}
        >
          {featuredCrafts.map((craft) => (
            <Link
              key={craft.id}
              to={`/buyer/products?craft=${encodeURIComponent(craft.name)}`}
              role="listitem"
              aria-label={`${craft.name} — ${craft.count} ${t('buyer.productsCount')}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-2)',
                background: 'var(--color-surface)',
                border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4) var(--space-5)',
                minWidth: '130px',
                scrollSnapAlign: 'start',
                textDecoration: 'none',
                transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span style={{ fontSize: '1.75rem' }} aria-hidden="true">
                {CRAFT_EMOJI[craft.name] || '🎭'}
              </span>
              <span
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--weight-semibold)',
                  color: 'var(--color-text)',
                  textAlign: 'center',
                  lineHeight: 1.3,
                }}
              >
                {craft.name}
              </span>
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-primary)',
                  background: 'var(--color-primary-light)',
                  borderRadius: 'var(--radius-full)',
                  padding: '2px 8px',
                  fontWeight: 'var(--weight-semibold)',
                }}
              >
                {craft.count} {t('buyer.productsCount')}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Section 2: Featured Products ── */}
      <section
        aria-labelledby="products-heading"
        style={{ padding: 'var(--space-4) var(--page-padding) var(--space-8)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <h2 id="products-heading" style={{ fontSize: 'var(--text-xl)', color: 'var(--color-text)' }}>
            {t('buyer.featuredProducts')}
          </h2>
          <Link
            to="/buyer/products"
            style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}
          >
            {t('buyer.viewAll')} <ChevronRight size={14} aria-hidden="true" />
          </Link>
        </div>

        <div
          role="list"
          aria-label="Featured products"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'var(--space-4)',
          }}
        >
          {featuredProducts.map((product) => (
            <div key={product.id} role="listitem">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        <style>{`
          @media (min-width: 768px) {
            #featured-products-grid { grid-template-columns: repeat(3, 1fr) !important; }
          }
        `}</style>
      </section>

      {/* ── Section 3: Featured Artisans ── */}
      <section
        aria-labelledby="artisans-heading"
        style={{
          padding: 'var(--space-8) 0',
          background: 'var(--color-surface-warm)',
          borderTop: '1px solid var(--color-border)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div style={{ padding: '0 var(--page-padding)', marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 id="artisans-heading" style={{ fontSize: 'var(--text-xl)', color: 'var(--color-text)' }}>
              {t('buyer.featuredArtisans')}
            </h2>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
            {t('buyer.featuredArtisansSub')}
          </p>
        </div>

        <div
          role="list"
          aria-label="Featured artisans"
          style={{
            display: 'flex',
            gap: 'var(--space-4)',
            overflowX: 'auto',
            padding: '0 var(--page-padding) var(--space-2)',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
          }}
        >
          {artisanList.map((artisan) => (
            <div key={artisan.id} role="listitem" style={{ scrollSnapAlign: 'start' }}>
              <ArtisanCard artisan={artisan} compact />
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 4: Explore by Region ── */}
      <section
        aria-labelledby="regions-heading"
        style={{ padding: 'var(--space-8) var(--page-padding)' }}
      >
        <h2
          id="regions-heading"
          style={{ fontSize: 'var(--text-xl)', color: 'var(--color-text)', marginBottom: 'var(--space-4)' }}
        >
          {t('buyer.exploreByRegion')}
        </h2>

        <div
          role="list"
          aria-label="Regions"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'var(--space-3)',
          }}
        >
          {regions.map((region, idx) => {
            const scheme = REGION_COLORS[idx % REGION_COLORS.length];
            return (
              <Link
                key={region.id}
                to={`/buyer/products?region=${encodeURIComponent(region.name)}`}
                role="listitem"
                aria-label={`${region.name} — ${region.artisans} ${t('buyer.artisansCount')}, ${region.products} ${t('buyer.productsCount')}`}
                style={{
                  background: scheme.bg,
                  border: `1px solid ${scheme.border}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-4)',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-2)',
                  transition: 'box-shadow var(--transition-fast)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  <MapPin size={14} style={{ color: scheme.text }} aria-hidden="true" />
                  <span
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--weight-bold)',
                      color: scheme.text,
                    }}
                  >
                    {region.name}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    <strong style={{ color: 'var(--color-text)' }}>{region.artisans}</strong> {t('buyer.artisansCount')}
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    <strong style={{ color: 'var(--color-text)' }}>{region.products}</strong> {t('buyer.productsCount')}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Footer area ── */}
      <footer
        className="buyer-home-footer"
        style={{
          background: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          padding: 'var(--space-8) var(--page-padding)',
          textAlign: 'center',
          marginTop: 'auto',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <p
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--weight-bold)',
            color: 'var(--color-primary)',
            marginBottom: 'var(--space-2)',
          }}
        >
          {t('buyer.footerTitle')}
        </p>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', maxWidth: '420px', margin: '0 auto' }}>
          {t('buyer.footerDesc')}
        </p>
      </footer>

      <style>{`
        .buyer-home-container {
          min-height: 100%;
          display: flex;
          flex-direction: column;
        }
        .buyer-home-footer {
          margin-top: auto;
          margin-bottom: calc(-1 * (var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px) + var(--space-4)));
          padding-bottom: calc(var(--space-8) + var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px));
        }
        @media (min-width: 768px) {
          [aria-label="Featured products"] {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          [aria-label="Regions"] {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
        @media (min-width: 1024px) {
          .buyer-home-footer {
            margin-bottom: calc(-1 * var(--space-8));
            padding-bottom: var(--space-8);
          }
        }
      `}</style>
    </div>
  );
}
