import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SearchX, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { products as initialProducts } from '../../data/mockData.js';
import { productService } from '../../services/productService.js';
import { ProductCard } from '../../components/product/ProductCard.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

const CATEGORIES = [
  { key: 'All', labelKey: 'buyer.allCategories' },
  { key: 'Textiles', labelKey: 'buyer.catTextiles' },
  { key: 'Pottery', labelKey: 'buyer.catPottery' },
  { key: 'Paintings', labelKey: 'buyer.catPaintings' },
  { key: 'Jewellery', labelKey: 'buyer.catJewellery' },
  { key: 'Woodcraft', labelKey: 'buyer.catWoodcraft' },
  { key: 'Metalwork', labelKey: 'buyer.catMetalwork' },
  { key: 'Embroidery', labelKey: 'buyer.catEmbroidery' },
];

/** Map filter chip labels to category substrings from mockData */
const CATEGORY_MAP = {
  All: null,
  Textiles: 'Textiles',
  Pottery: 'Pottery',
  Paintings: 'Paintings',
  Jewellery: 'Jewellery',
  Woodcraft: 'Woodcraft',
  Metalwork: 'Metalwork',
  Embroidery: 'Embroidery',
};

export function ProductDiscovery() {
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('default');
  const [sortOpen, setSortOpen] = useState(false);
  const [allProducts, setAllProducts] = useState(initialProducts);

  const sortOptions = [
    { value: 'default', label: t('buyer.sortFeatured') },
    { value: 'price-asc', label: t('buyer.sortPriceLow') },
    { value: 'price-desc', label: t('buyer.sortPriceHigh') },
    { value: 'newest', label: t('buyer.sortNewest') },
  ];

  useEffect(() => {
    let isMounted = true;
    productService.getProducts().then((data) => {
      if (isMounted && data) setAllProducts(data);
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const publishedProducts = useMemo(
    () => allProducts.filter((p) => p.status === 'published'),
    [allProducts]
  );

  const filteredProducts = useMemo(() => {
    let result = [...publishedProducts];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.craft.toLowerCase().includes(q) ||
          p.artisanName.toLowerCase().includes(q) ||
          p.region?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Category filter
    const catKey = CATEGORY_MAP[activeCategory];
    if (catKey) {
      result = result.filter((p) => p.category?.includes(catKey));
    }

    // Sort
    if (sortBy === 'price-asc') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') result.sort((a, b) => b.price - a.price);
    else if (sortBy === 'newest') result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return result;
  }, [searchQuery, activeCategory, sortBy, publishedProducts]);

  const activeSortLabel = sortOptions.find((o) => o.value === sortBy)?.label || t('buyer.sortBy');

  return (
    <div
      className="page page-with-bottom-nav"
      style={{ background: 'var(--color-bg)', padding: 0 }}
    >
      {/* ── Search + Filters header ── */}
      <div
        style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          padding: 'var(--space-4) var(--page-padding) 0',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        {/* Search input */}
        <div style={{ position: 'relative', marginBottom: 'var(--space-3)' }}>
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
            placeholder={t('buyer.searchProductsPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search products"
            style={{ paddingLeft: '2.75rem', borderRadius: 'var(--radius-full)' }}
          />
        </div>

        {/* Filters row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            paddingBottom: 'var(--space-3)',
            position: 'relative',
          }}
          role="toolbar"
          aria-label="Filter and sort products"
        >
          {/* Scrollable category chips */}
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-2)',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              flex: 1,
              minWidth: 0,
              alignItems: 'center',
              paddingRight: 'var(--space-1)',
            }}
          >
            {CATEGORIES.map(({ key: cat, labelKey }) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                aria-pressed={activeCategory === cat}
                aria-label={`Filter by ${t(labelKey)}`}
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  borderRadius: 'var(--radius-full)',
                  border: '1.5px solid',
                  borderColor: activeCategory === cat ? 'var(--color-primary)' : 'var(--color-border)',
                  background: activeCategory === cat ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: activeCategory === cat ? 'var(--color-text-inverse)' : 'var(--color-text-muted)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--weight-medium)',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all var(--transition-fast)',
                  minHeight: '36px',
                }}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '28px', background: 'var(--color-border)', flexShrink: 0 }} aria-hidden="true" />

          {/* Sort button (outside overflowX container so dropdown is fully visible) */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setSortOpen((v) => !v)}
              aria-expanded={sortOpen}
              aria-haspopup="listbox"
              aria-label={`Sort by: ${activeSortLabel}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-1)',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-full)',
                border: '1.5px solid var(--color-border)',
                background: sortBy !== 'default' ? 'var(--color-surface-teal)' : 'var(--color-surface)',
                color: sortBy !== 'default' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-medium)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                minHeight: '36px',
              }}
            >
              <SlidersHorizontal size={14} aria-hidden="true" />
              {activeSortLabel}
              <ChevronDown size={13} aria-hidden="true" style={{ transform: sortOpen ? 'rotate(180deg)' : 'none', transition: 'transform var(--transition-fast)' }} />
            </button>

            {sortOpen && (
              <>
                <div
                  onClick={() => setSortOpen(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                  aria-hidden="true"
                />
                <ul
                  role="listbox"
                  aria-label="Sort options"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + var(--space-2))',
                    right: 0,
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    minWidth: '200px',
                    zIndex: 50,
                    overflow: 'hidden',
                    padding: 'var(--space-2)',
                  }}
                >
                  {sortOptions.map((opt) => (
                    <li
                      key={opt.value}
                      role="option"
                      aria-selected={sortBy === opt.value}
                      onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                      style={{
                        padding: 'var(--space-3) var(--space-4)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        fontSize: 'var(--text-sm)',
                        fontWeight: sortBy === opt.value ? 'var(--weight-semibold)' : 'var(--weight-regular)',
                        color: sortBy === opt.value ? 'var(--color-primary)' : 'var(--color-text)',
                        background: sortBy === opt.value ? 'var(--color-surface-teal)' : 'transparent',
                        transition: 'background var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => { if (sortBy !== opt.value) e.currentTarget.style.background = 'var(--color-border-light)'; }}
                      onMouseLeave={(e) => { if (sortBy !== opt.value) e.currentTarget.style.background = 'transparent'; }}
                    >
                      {opt.label}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Results area ── */}
      <div style={{ padding: 'var(--space-4) var(--page-padding)' }}>
        {/* Result count */}
        <p
          style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}
          aria-live="polite"
          aria-atomic="true"
        >
          {filteredProducts.length === 0
            ? t('buyer.noProductsFound')
            : `${filteredProducts.length} ${t('buyer.productsCount')}`}
          {activeCategory !== 'All' ? ` in ${activeCategory}` : ''}
          {searchQuery.trim() ? ` for "${searchQuery.trim()}"` : ''}
        </p>

        {/* Empty State */}
        {filteredProducts.length === 0 ? (
          <div
            role="status"
            aria-label="No products found"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-16) var(--space-8)',
              textAlign: 'center',
              gap: 'var(--space-4)',
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'var(--color-border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-hidden="true"
            >
              <SearchX size={32} style={{ color: 'var(--color-text-muted)' }} />
            </div>
            <div>
              <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>
                {t('buyer.noCraftsFound')}
              </p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
                {t('buyer.noCraftsFoundDesc')}
              </p>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => { setSearchQuery(''); setActiveCategory('All'); setSortBy('default'); }}
              aria-label="Clear all filters"
            >
              {t('buyer.clearFilters')}
            </button>
          </div>
        ) : (
          /* Product Grid */
          <div
            id="discovery-products-grid"
            className="buyer-products-grid"
            role="list"
            aria-label="Products"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 'var(--space-4)',
              alignItems: 'stretch',
              width: '100%',
            }}
          >
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                role="listitem"
                style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media (min-width: 768px) {
          [aria-label="Products"] {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }

        @media (max-width: 599px) {
          #discovery-products-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: var(--space-3) !important;
          }
        }
        @media (min-width: 600px) and (max-width: 1023px) {
          #discovery-products-grid {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)) !important;
            gap: var(--space-4) !important;
          }
        }
        @media (min-width: 1024px) {
          #discovery-products-grid {
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)) !important;
            gap: var(--space-4) !important;
          }
        }
      `}</style>
    </div>
  );
}
