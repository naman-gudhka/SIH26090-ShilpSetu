import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, MapPin, Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { savedItemsService } from '../../services/productService.js';

const CATEGORY_NAMES_HI = {
  Textiles: 'वस्त्र',
  Pottery: 'मिट्टी के बर्तन',
  Paintings: 'चित्रकला',
  Jewellery: 'आभूषण',
  Woodcraft: 'काष्ठकला',
  Metalwork: 'धातु शिल्प',
  Accessories: 'उपसाधन',
  Home: 'गृह सज्जा',
  Art: 'कला',
};

/**
 * ProductCard — reusable product tile for buyer-facing grids.
 * Props:
 *   product  — product object from mockData
 *   compact  — (bool) smaller variant
 *   onClick  — optional override click handler
 */
export function ProductCard({ product, compact = false, onClick }) {
  const navigate = useNavigate();
  const { currentUser, role } = useAuth();
  const { language, isHindi: ctxIsHindi } = useLanguage();
  const isHindi = ctxIsHindi || language === 'hi';
  const userId = currentUser?.uid;

  const [isSaved, setIsSaved] = useState(() => (product?.id ? savedItemsService.isSaved(product.id, userId) : false));

  useEffect(() => {
    if (!product?.id) return;

    const handleSavedChange = () => {
      setIsSaved(savedItemsService.isSaved(product.id, userId));
    };
    window.addEventListener('shilpsetu_saved_items_changed', handleSavedChange);
    return () => window.removeEventListener('shilpsetu_saved_items_changed', handleSavedChange);
  }, [product?.id, userId]);

  if (!product) return null;

  const handleToggleSave = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const updated = savedItemsService.toggleSave(product.id, userId);
    setIsSaved(updated);
  };

  const handleClick = () => {
    if (onClick) return onClick(product);
    if (role === 'artisan') {
      navigate(`/artisan/products/${product.id}`);
    } else {
      navigate(`/buyer/products/${product.id}`);
    }
  };

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(product.price);

  const displayTitle = isHindi && (product.titleHindi || product.titleHi)
    ? (product.titleHindi || product.titleHi)
    : product.title;

  const rawCat = product.category?.split(' ')[0] || '';
  const displayCat = isHindi ? (CATEGORY_NAMES_HI[rawCat] || rawCat) : rawCat;

  return (
    <article
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`View ${displayTitle}`}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'box-shadow var(--transition-base), transform var(--transition-base)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        boxSizing: 'border-box',
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
      {/* Image Area */}
      <div
        style={{
          width: '100%',
          aspectRatio: compact ? '4/3' : '1/1',
          background: 'linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-surface-teal) 60%, var(--color-border-light) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          flexShrink: 0,
          overflow: 'hidden',
        }}
        aria-hidden="true"
      >
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={displayTitle}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
            <Package size={compact ? 28 : 36} style={{ color: 'var(--color-primary)', opacity: 0.5 }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 'var(--weight-medium)' }}>
              {product.craft}
            </span>
          </div>
        )}

        {/* Category badge overlay */}
        {displayCat && (
          <span
            className="badge badge-accent"
            style={{ position: 'absolute', top: 'var(--space-2)', left: 'var(--space-2)', zIndex: 1 }}
          >
            {displayCat}
          </span>
        )}

        {/* Wishlist Heart button */}
        <button
          type="button"
          onClick={handleToggleSave}
          aria-label={isSaved ? `Remove ${displayTitle} from saved items` : `Save ${displayTitle}`}
          style={{
            position: 'absolute',
            top: 'var(--space-2)',
            right: 'var(--space-2)',
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.9)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            transition: 'transform var(--transition-fast), background var(--transition-fast)',
            padding: 0,
            zIndex: 2,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Heart
            size={16}
            style={{
              color: isSaved ? '#DC2626' : 'var(--color-text-muted)',
              fill: isSaved ? '#DC2626' : 'none',
              transition: 'all var(--transition-fast)',
            }}
          />
        </button>
      </div>

      {/* Content */}
      <div style={{
        padding: compact ? 'var(--space-3)' : 'var(--space-4)',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 'var(--space-2)',
      }}>
        <div>
          <p
            style={{
              fontSize: compact ? 'var(--text-sm)' : 'var(--text-base)',
              fontWeight: 'var(--weight-semibold)',
              color: 'var(--color-text)',
              lineHeight: 1.35,
              minHeight: '2.7em',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              margin: 0,
            }}
          >
            {displayTitle}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
            <MapPin size={12} aria-hidden="true" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 'var(--text-xs)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {product.artisanLocation}
            </span>
          </div>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 'var(--space-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
          <span
            style={{
              fontSize: compact ? 'var(--text-base)' : 'var(--text-lg)',
              fontWeight: 'var(--weight-bold)',
              color: 'var(--color-primary)',
            }}
          >
            {formattedPrice}
          </span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
            {isHindi ? `${product.artisanName?.split(' ')[0]} द्वारा` : `by ${product.artisanName?.split(' ')[0]}`}
          </span>
        </div>
      </div>
    </article>
  );
}
