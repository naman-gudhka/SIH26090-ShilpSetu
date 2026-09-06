import { useState, useMemo, useEffect } from 'react';
import { Package, Search, Eye, X } from 'lucide-react';
import { productService } from '../../services/productService.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

const STATUS_TABS = ['All', 'published', 'processing', 'draft', 'pending'];

const STATUS_STYLES = {
  published: {
    bg: 'var(--color-success-bg)',
    color: 'var(--color-success)',
  },
  processing: {
    bg: 'var(--color-warning-bg)',
    color: 'var(--color-warning)',
  },
  draft: {
    bg: 'var(--color-border-light)',
    color: 'var(--color-text-muted)',
  },
  pending: {
    bg: 'var(--color-warning-bg)',
    color: 'var(--color-warning)',
  },
};

export function AdminProducts() {
  const { t, isHindi } = useLanguage();
  const [activeTab, setActiveTab] = useState('All');
  const [query, setQuery] = useState('');
  const [craftFilter, setCraftFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productList, setProductList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    productService
      .getProducts()
      .then((data) => {
        if (isMounted) {
          if (data) setProductList(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const tabCounts = useMemo(() => {
    const counts = {
      All: productList.length,
    };

    STATUS_TABS.slice(1).forEach((status) => {
      counts[status] = productList.filter(
        (product) => product.status === status
      ).length;
    });

    return counts;
  }, [productList]);

  const availableCrafts = useMemo(() => {
    return [
      ...new Set(
        productList.map((product) => product.craft).filter(Boolean)
      ),
    ].sort();
  }, [productList]);

  const filtered = useMemo(() => {
    return productList
      .filter((product) => {
        const search = query.toLowerCase();

        const matchTab =
          activeTab === 'All' || product.status === activeTab;

        const matchQuery =
          !query ||
          product.title?.toLowerCase().includes(search) ||
          product.artisanName?.toLowerCase().includes(search) ||
          product.craft?.toLowerCase().includes(search) ||
          product.category?.toLowerCase().includes(search);

        const matchCraft =
          !craftFilter || product.craft === craftFilter;

        return matchTab && matchQuery && matchCraft;
      })
      .sort((a, b) => {
        if (sortBy === 'price-desc') {
          return (b.price || 0) - (a.price || 0);
        }

        if (sortBy === 'price-asc') {
          return (a.price || 0) - (b.price || 0);
        }

        if (sortBy === 'title') {
          return (a.title || '').localeCompare(b.title || '');
        }

        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
  }, [activeTab, query, craftFilter, sortBy, productList]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        padding: '24px 16px 48px',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 24,
          }}
        >
            <h1
            style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--weight-bold)',
              color: 'var(--color-text)',
            }}
          >
            {t('admin.productsTitle')}
          </h1>

          <span
            style={{
              background: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              borderRadius: 999,
              padding: '2px 12px',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-semibold)',
            }}
          >
            {productList.length}
          </span>
        </header>

        {/* Filter controls toolbar */}
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            padding: '16px 20px',
            marginBottom: 16,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <div
            style={{
              position: 'relative',
              flex: '1 1 240px',
              minWidth: 220,
            }}
          >
            <Search
              size={16}
              color="var(--color-text-muted)"
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            />

            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('admin.searchProductsPlaceholder')}
              aria-label={t('admin.searchProductsPlaceholder')}
              style={{
                width: '100%',
                padding: '10px 12px 10px 38px',
                border: '1.5px solid var(--color-border)',
                borderRadius: 8,
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text)',
                background: 'var(--color-bg)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <select
            value={craftFilter}
            onChange={(e) => setCraftFilter(e.target.value)}
            aria-label={t('admin.allCrafts')}
            style={{
              padding: '9px 12px',
              border: '1.5px solid var(--color-border)',
              borderRadius: 8,
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text)',
              background: 'var(--color-surface)',
              cursor: 'pointer',
              flex: '0 1 auto',
            }}
          >
            <option value="">{t('admin.allCrafts')}</option>

            {availableCrafts.map((craft) => (
              <option key={craft} value={craft}>
                {craft}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label={t('buyer.sortBy')}
            style={{
              padding: '9px 12px',
              border: '1.5px solid var(--color-border)',
              borderRadius: 8,
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text)',
              background: 'var(--color-surface)',
              cursor: 'pointer',
              flex: '0 1 auto',
            }}
          >
            <option value="newest">{isHindi ? 'क्रमबद्ध: नवीनतम पहले' : 'Sort: Newest First'}</option>
            <option value="price-desc">{isHindi ? 'क्रमबद्ध: कीमत (उच्च से निम्न)' : 'Sort: Price (High to Low)'}</option>
            <option value="price-asc">{isHindi ? 'क्रमबद्ध: कीमत (निम्न से उच्च)' : 'Sort: Price (Low to High)'}</option>
            <option value="title">{isHindi ? 'क्रमबद्ध: शीर्षक (अ-ज्ञ)' : 'Sort: Title (A–Z)'}</option>
          </select>
        </div>

        {/* Status Tabs */}
        <div
          role="tablist"
          aria-label="Filter products by status"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px 12px 0 0',
            borderBottom: 'none',
            padding: '0 8px',
            display: 'flex',
            overflowX: 'auto',
          }}
        >
          {STATUS_TABS.map((tab) => {
            const active = activeTab === tab;
            const tabLabel = tab === 'All' ? t('admin.all') : (t(`status.${tab}`) || tab);

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                aria-pressed={active}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  border: 'none',
                  borderBottom: `2.5px solid ${
                    active
                      ? 'var(--color-primary)'
                      : 'transparent'
                  }`,
                  background: 'transparent',
                  color: active
                    ? 'var(--color-primary)'
                    : 'var(--color-text-muted)',
                  fontWeight: active
                    ? 'var(--weight-semibold)'
                    : 'var(--weight-medium)',
                  fontSize: 'var(--text-sm)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  minHeight: 44,
                  textTransform: 'capitalize',
                }}
              >
                {tabLabel}

                <span
                  style={{
                    background: active
                      ? 'var(--color-primary-light)'
                      : 'var(--color-border-light)',
                    color: active
                      ? 'var(--color-primary)'
                      : 'var(--color-text-muted)',
                    borderRadius: 999,
                    padding: '1px 7px',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--weight-semibold)',
                  }}
                >
                  {tabCounts[tab]}
                </span>
              </button>
            );
          })}
        </div>

        <section
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '0 0 12px 12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}
        >
          {loading ? (
            <div
              style={{
                padding: '64px 24px',
                textAlign: 'center',
                color: 'var(--color-text-muted)',
              }}
            >
              <Package
                size={40}
                color="var(--color-border)"
                style={{ marginBottom: 12 }}
              />

              <p>{isHindi ? 'उत्पाद लोड हो रहे हैं…' : 'Loading products…'}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                padding: '64px 24px',
                textAlign: 'center',
                color: 'var(--color-text-muted)',
              }}
            >
              <Package
                size={40}
                color="var(--color-border)"
                style={{ marginBottom: 12 }}
              />

              <p>
                {isHindi ? 'चयनित फ़िल्टर या खोज से कोई उत्पाद मेल नहीं खाता।' : 'No products match the selected filters or query.'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text)',
                }}
                aria-label="Products list"
              >
                <thead>
                  <tr
                    style={{
                      background: 'var(--color-surface-warm)',
                      borderBottom:
                        '1px solid var(--color-border)',
                    }}
                  >
                    {[
                      t('nav.products'),
                      t('role.artisan'),
                      t('admin.colCraft'),
                      t('admin.colPrice'),
                      t('admin.colStatus'),
                      t('admin.colDate'),
                      t('admin.colActions'),
                    ].map((heading) => (
                      <th
                        key={heading}
                        scope="col"
                        style={{
                          padding: '10px 16px',
                          textAlign: 'left',
                          fontWeight:
                            'var(--weight-semibold)',
                          color:
                            'var(--color-text-muted)',
                          fontSize: 'var(--text-xs)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((product, i) => {
                    const statusStyle =
                      STATUS_STYLES[product.status] ||
                      STATUS_STYLES.draft;

                    const thumb = product.images?.[0];

                    return (
                      <tr
                        key={product.id}
                        onClick={() =>
                          setSelectedProduct(product)
                        }
                        style={{
                          background:
                            i % 2 === 0
                              ? 'var(--color-surface)'
                              : 'var(--color-surface-warm)',
                          borderBottom:
                            '1px solid var(--color-border)',
                          cursor: 'pointer',
                          transition:
                            'background var(--transition-fast)',
                        }}
                      >
                        <td
                          style={{
                            padding: '12px 16px',
                            maxWidth: 280,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                            }}
                          >
                            {thumb ? (
                              <img
                                src={thumb}
                                alt={isHindi && product.titleHindi ? product.titleHindi : product.title}
                                style={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: 8,
                                  objectFit: 'cover',
                                  border:
                                    '1px solid var(--color-border)',
                                  flexShrink: 0,
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: 8,
                                  background:
                                    'var(--color-border-light)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent:
                                    'center',
                                  flexShrink: 0,
                                }}
                              >
                                <Package
                                  size={20}
                                  color="var(--color-text-light)"
                                />
                              </div>
                            )}

                            <div>
                              <p
                                style={{
                                  fontWeight:
                                    'var(--weight-semibold)',
                                  margin: '0 0 2px',
                                  overflow: 'hidden',
                                  textOverflow:
                                    'ellipsis',
                                  whiteSpace: 'nowrap',
                                  maxWidth: 200,
                                }}
                                title={product.title}
                              >
                                {isHindi && product.titleHindi ? product.titleHindi : product.title}
                              </p>

                              {product.category && (
                                <p
                                  style={{
                                    fontSize:
                                      'var(--text-xs)',
                                    color:
                                      'var(--color-text-muted)',
                                    margin: 0,
                                  }}
                                >
                                  {product.category}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td
                          style={{
                            padding: '12px 16px',
                            color:
                              'var(--color-text-muted)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {product.artisanName}
                        </td>

                        <td
                          style={{
                            padding: '12px 16px',
                            color:
                              'var(--color-text-muted)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {product.craft}
                        </td>

                        <td
                          style={{
                            padding: '12px 16px',
                            fontWeight:
                              'var(--weight-semibold)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          ₹
                          {(product.price || 0).toLocaleString(
                            'en-IN'
                          )}
                        </td>

                        <td
                          style={{
                            padding: '12px 16px',
                          }}
                        >
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 10px',
                              borderRadius: 999,
                              fontSize: 'var(--text-xs)',
                              fontWeight:
                                'var(--weight-semibold)',
                              background:
                                statusStyle.bg,
                              color:
                                statusStyle.color,
                              textTransform:
                                'capitalize',
                            }}
                          >
                            {t(`status.${product.status}`) || product.status}
                          </span>
                        </td>

                        <td
                          style={{
                            padding: '12px 16px',
                            color:
                              'var(--color-text-muted)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {product.createdAt
                            ? new Date(
                                product.createdAt
                              ).toLocaleDateString(
                                isHindi ? 'hi-IN' : 'en-IN',
                                {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                }
                              )
                            : '—'}
                        </td>

                        <td
                          style={{
                            padding: '12px 16px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProduct(product);
                            }}
                            aria-label={`View details for ${product.title}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '4px 10px',
                              borderRadius: 6,
                              border:
                                '1px solid var(--color-border)',
                              background:
                                'var(--color-surface)',
                              color:
                                'var(--color-primary)',
                              fontSize:
                                'var(--text-xs)',
                              fontWeight:
                                'var(--weight-medium)',
                              cursor: 'pointer',
                            }}
                          >
                            <Eye size={13} />
                            {t('admin.viewDetails')}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p
          style={{
            marginTop: 12,
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            textAlign: 'right',
          }}
        >
          {isHindi ? `${productList.length} में से ${filtered.length} उत्पाद दिख रहे हैं` : `Showing ${filtered.length} of ${productList.length} products`}
        </p>

        {/* Product Detail Modal */}
        {selectedProduct && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 200,
              background: 'rgba(28,43,42,0.5)',
              backdropFilter: 'blur(3px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
            onClick={() => setSelectedProduct(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--color-surface)',
                borderRadius: 16,
                maxWidth: 540,
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--color-border)',
                position: 'relative',
                padding: '24px',
                boxSizing: 'border-box',
              }}
            >
              <button
                onClick={() => setSelectedProduct(null)}
                aria-label="Close dialog"
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  padding: 4,
                }}
              >
                <X size={20} />
              </button>

              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  marginBottom: 16,
                  alignItems: 'flex-start',
                }}
              >
                {selectedProduct.images?.[0] ? (
                  <img
                    src={selectedProduct.images[0]}
                    alt={selectedProduct.title}
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 10,
                      objectFit: 'cover',
                      border:
                        '1px solid var(--color-border)',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 10,
                      background:
                        'var(--color-border-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Package
                      size={36}
                      color="var(--color-text-light)"
                    />
                  </div>
                )}

                <div>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 999,
                      fontSize: '11px',
                      fontWeight: 600,
                      background:
                        STATUS_STYLES[
                          selectedProduct.status
                        ]?.bg ||
                        'var(--color-border-light)',
                      color:
                        STATUS_STYLES[
                          selectedProduct.status
                        ]?.color ||
                        'var(--color-text-muted)',
                      textTransform: 'capitalize',
                      marginBottom: 6,
                    }}
                  >
                    {t(`status.${selectedProduct.status}`) || selectedProduct.status}
                  </span>

                  <h3
                    id="product-modal-title"
                    style={{
                      fontSize: 'var(--text-lg)',
                      fontWeight:
                        'var(--weight-bold)',
                      color: 'var(--color-text)',
                      margin: '0 0 4px',
                    }}
                  >
                    {isHindi && selectedProduct.titleHindi ? selectedProduct.titleHindi : selectedProduct.title}
                  </h3>

                  <p
                    style={{
                      fontSize: 'var(--text-base)',
                      fontWeight:
                        'var(--weight-bold)',
                      color: 'var(--color-primary)',
                      margin: 0,
                    }}
                  >
                    ₹
                    {selectedProduct.price?.toLocaleString(
                      'en-IN'
                    )}
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  marginBottom: 16,
                  background:
                    'var(--color-surface-warm)',
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 'var(--text-xs)',
                }}
              >
                <div>
                  <span
                    style={{
                      color:
                        'var(--color-text-muted)',
                      display: 'block',
                    }}
                  >
                    {isHindi ? 'कारीगर:' : 'Artisan:'}
                  </span>

                  <strong
                    style={{
                      color: 'var(--color-text)',
                    }}
                  >
                    {selectedProduct.artisanName ||
                      (isHindi ? 'अनिर्दिष्ट' : 'Unassigned')}
                  </strong>
                </div>

                <div>
                  <span
                    style={{
                      color:
                        'var(--color-text-muted)',
                      display: 'block',
                    }}
                  >
                    {isHindi ? 'शिल्प:' : 'Craft:'}
                  </span>

                  <strong
                    style={{
                      color: 'var(--color-text)',
                    }}
                  >
                    {selectedProduct.craft ||
                      (isHindi ? 'सामान्य' : 'General')}
                  </strong>
                </div>

                <div>
                  <span
                    style={{
                      color:
                        'var(--color-text-muted)',
                      display: 'block',
                    }}
                  >
                    {isHindi ? 'श्रेणी:' : 'Category:'}
                  </span>

                  <strong
                    style={{
                      color: 'var(--color-text)',
                    }}
                  >
                    {selectedProduct.category ||
                      (isHindi ? 'हस्तशिल्प' : 'Handicrafts')}
                  </strong>
                </div>

                <div>
                  <span
                    style={{
                      color:
                        'var(--color-text-muted)',
                      display: 'block',
                    }}
                  >
                    {t('artisan.dimensions')} / {t('artisan.weight')}:
                  </span>

                  <strong
                    style={{
                      color: 'var(--color-text)',
                    }}
                  >
                    {selectedProduct.dimensions ||
                      (isHindi ? 'मानक' : 'Standard')}{' '}
                    /{' '}
                    {selectedProduct.weight ||
                      (isHindi ? 'मानक' : 'Standard')}
                  </strong>
                </div>
              </div>

              {selectedProduct.description && (
                <div style={{ marginBottom: 16 }}>
                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      color:
                        'var(--color-text-muted)',
                      fontWeight:
                        'var(--weight-semibold)',
                    }}
                  >
                    {t('buyer.aboutThisPiece')}
                  </span>

                  <p
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--color-text)',
                      lineHeight: 1.5,
                      margin: '4px 0 0',
                    }}
                  >
                    {isHindi && selectedProduct.descriptionHindi ? selectedProduct.descriptionHindi : selectedProduct.description}
                  </p>
                </div>
              )}

              {selectedProduct.materials && (
                <div style={{ marginBottom: 16 }}>
                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      color:
                        'var(--color-text-muted)',
                      fontWeight:
                        'var(--weight-semibold)',
                    }}
                  >
                    {t('artisan.materials')}
                  </span>

                  <p
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--color-text)',
                      margin: '4px 0 0',
                    }}
                  >
                    {Array.isArray(
                      selectedProduct.materials
                    )
                      ? selectedProduct.materials.join(
                          ', '
                        )
                      : selectedProduct.materials}
                  </p>
                </div>
              )}

              <div
                style={{
                  padding: '10px 12px',
                  background:
                    'var(--color-primary-light)',
                  borderRadius: 8,
                  fontSize: '11px',
                  color: 'var(--color-primary)',
                  lineHeight: 1.4,
                  marginBottom: 16,
                }}
              >
                <strong>
                  {isHindi ? 'मंच मॉडरेशन सूचना:' : 'Platform Moderation Notice:'}
                </strong>{' '}
                {isHindi
                  ? 'उत्पाद अद्यतन और निर्माण संबंधित कारीगर द्वारा अधिकृत हैं। क्लाउड फ़ंक्शंस के माध्यम से टीम 2 एकीकरण में व्यवस्थापकीय अनुपालन लागू किया जाएगा।'
                  : 'Product updates and creation are authored by the respective artisan. Administrative overrides and server-side compliance moderation will be enforced via Cloud Functions in Team 2 integration.'}
              </div>

              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 8,
                  border: 'none',
                  background:
                    'var(--color-primary)',
                  color: '#fff',
                  fontWeight:
                    'var(--weight-semibold)',
                  fontSize: 'var(--text-sm)',
                  cursor: 'pointer',
                }}
              >
                {t('actions.close')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}