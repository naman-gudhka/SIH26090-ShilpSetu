import { useState, useMemo, useEffect } from 'react';
import { Search, Star, Eye, X, CheckCircle, ShieldCheck, ShieldOff, Loader2 } from 'lucide-react';
import { artisanService } from '../../services/artisanService.js';
import { productService } from '../../services/productService.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

const FILTER_KEYS = [
  { key: 'All', transKey: 'admin.all' },
  { key: 'Verified', transKey: 'admin.verified' },
  { key: 'Unverified', transKey: 'admin.unverified' },
];

export function AdminArtisans() {
  const { t, isHindi } = useLanguage();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('');
  const [artisanList, setArtisanList] = useState([]);
  const [productList, setProductList] = useState([]);
  const [selectedArtisan, setSelectedArtisan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      artisanService.getArtisans(),
      productService.getProducts(),
    ])
      .then(([arts, prods]) => {
        if (isMounted) {
          if (arts) setArtisanList(arts);
          if (prods) setProductList(prods);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    const handleArtisansChanged = (e) => {
      const { id, updates, artisan } = e.detail || {};
      if (!id) return;
      setArtisanList((prev) =>
        prev.map((a) => (a.id === id ? (artisan ? { ...a, ...artisan } : { ...a, ...updates }) : a))
      );
      setSelectedArtisan((prev) => {
        if (!prev || prev.id !== id) return prev;
        return artisan ? { ...prev, ...artisan } : { ...prev, ...updates };
      });
    };

    window.addEventListener('shilpsetu_artisans_changed', handleArtisansChanged);

    return () => {
      isMounted = false;
      window.removeEventListener('shilpsetu_artisans_changed', handleArtisansChanged);
    };
  }, []);

  const handleToggleVerification = async (artisanToToggle, e) => {
    if (e) e.stopPropagation();
    if (!artisanToToggle || updatingId) return;

    const newStatus = !artisanToToggle.verified;
    setUpdatingId(artisanToToggle.id);
    try {
      await artisanService.updateArtisan(artisanToToggle.id, {
        verified: newStatus,
      });

      setArtisanList((prev) =>
        prev.map((a) => (a.id === artisanToToggle.id ? { ...a, verified: newStatus } : a))
      );

      if (selectedArtisan && selectedArtisan.id === artisanToToggle.id) {
        setSelectedArtisan((prev) => ({ ...prev, verified: newStatus }));
      }

      setToastMessage(
        newStatus
          ? t('admin.artisanVerifiedSuccess')
          : t('admin.artisanUnverifiedSuccess')
      );
      setTimeout(() => setToastMessage(''), 3000);
    } catch {
      // Fallback
    } finally {
      setUpdatingId(null);
    }
  };

  const allStates = useMemo(
    () =>
      [...new Set(artisanList.map((a) => a.state).filter(Boolean))].sort(),
    [artisanList]
  );

  const filtered = useMemo(
    () =>
      artisanList.filter((a) => {
        const search = query.toLowerCase();

        const matchQ =
          !query ||
          a.name?.toLowerCase().includes(search) ||
          a.craft?.toLowerCase().includes(search) ||
          a.state?.toLowerCase().includes(search) ||
          a.city?.toLowerCase().includes(search);

        const matchV =
          filter === 'All'
            ? true
            : filter === 'Verified'
              ? a.verified
              : !a.verified;

        const matchS = !stateFilter || a.state === stateFilter;

        return matchQ && matchV && matchS;
      }),
    [artisanList, query, filter, stateFilter]
  );

  const artisanProducts = useMemo(() => {
    if (!selectedArtisan) return [];

    return productList.filter(
      (p) => p.artisanId === selectedArtisan.id
    );
  }, [selectedArtisan, productList]);

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
            {t('admin.artisansTitle')}
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
            {artisanList.length}
          </span>
        </header>

        {toastMessage && (
          <div
            role="status"
            style={{
              position: 'fixed',
              top: 24,
              right: 24,
              zIndex: 9999,
              background: 'var(--color-primary)',
              color: '#fff',
              padding: '12px 20px',
              borderRadius: 10,
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-semibold)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <CheckCircle size={18} />
            <span>{toastMessage}</span>
          </div>
        )}

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
              flex: '1 1 220px',
              minWidth: 200,
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
              placeholder={t('admin.searchArtisansPlaceholder')}
              aria-label={t('admin.searchArtisansPlaceholder')}
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

          <div
            role="group"
            aria-label="Filter by verification"
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            {FILTER_KEYS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                aria-pressed={filter === f.key}
                style={{
                  padding: '6px 16px',
                  borderRadius: 999,
                  border:
                    filter === f.key
                      ? '1.5px solid var(--color-primary)'
                      : '1.5px solid var(--color-border)',
                  background:
                    filter === f.key
                      ? 'var(--color-primary)'
                      : 'var(--color-surface)',
                  color:
                    filter === f.key ? '#fff' : 'var(--color-text)',
                  fontWeight: 'var(--weight-medium)',
                  fontSize: 'var(--text-sm)',
                  cursor: 'pointer',
                  minHeight: 36,
                }}
              >
                {t(f.transKey)}
              </button>
            ))}
          </div>

          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            aria-label={t('admin.allStates')}
            style={{
              padding: '8px 12px',
              border: '1.5px solid var(--color-border)',
              borderRadius: 8,
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text)',
              background: 'var(--color-surface)',
              cursor: 'pointer',
            }}
          >
            <option value="">{t('admin.allStates')}</option>

            {allStates.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <section
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
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
              <p>{isHindi ? 'कारीगर लोड हो रहे हैं…' : 'Loading artisans…'}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                padding: '64px 24px',
                textAlign: 'center',
                color: 'var(--color-text-muted)',
              }}
            >
              <p
                style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 'var(--weight-medium)',
                  marginBottom: 8,
                }}
              >
                {isHindi ? 'कोई कारीगर नहीं मिला' : 'No artisans found'}
              </p>

              <p style={{ fontSize: 'var(--text-sm)' }}>
                {isHindi ? 'अपनी खोज या फ़िल्टर समायोजित करने का प्रयास करें।' : 'Try adjusting your search or filters.'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 'var(--text-sm)',
                }}
                aria-label="Artisans list"
              >
                <thead>
                  <tr
                    style={{
                      background: 'var(--color-surface-warm)',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    {[
                      t('admin.artisansTitle'),
                      t('admin.colCraft'),
                      t('admin.colRegion'),
                      `${t('admin.productsTitle')} (Live)`,
                      t('buyer.rating'),
                      t('admin.colStatus'),
                      t('admin.colActions'),
                    ].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        style={{
                          padding: '10px 16px',
                          textAlign: 'left',
                          fontWeight: 'var(--weight-semibold)',
                          color: 'var(--color-text-muted)',
                          fontSize: 'var(--text-xs)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((a, i) => {
                    const liveCount =
                      productList.filter(
                        (p) => p.artisanId === a.id
                      ).length ||
                      a.published ||
                      0;

                    return (
                      <tr
                        key={a.id}
                        onClick={() => setSelectedArtisan(a)}
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
                        <td style={{ padding: '12px 16px' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                            }}
                          >
                            <span
                              aria-hidden="true"
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                background:
                                  'var(--color-primary-light)',
                                color: 'var(--color-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight:
                                  'var(--weight-bold)',
                                flexShrink: 0,
                              }}
                            >
                              {a.name?.[0] || 'A'}
                            </span>

                            <div>
                              <p
                                style={{
                                  fontWeight:
                                    'var(--weight-medium)',
                                  margin: 0,
                                }}
                              >
                                {a.name}
                              </p>

                              <p
                                style={{
                                  fontSize: 'var(--text-xs)',
                                  color:
                                    'var(--color-text-muted)',
                                  margin: 0,
                                }}
                              >
                                {a.experience || (isHindi ? 'मास्टर शिल्पकार' : 'Master Artisan')}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td
                          style={{
                            padding: '12px 16px',
                            color: 'var(--color-text-muted)',
                          }}
                        >
                          {a.craft}
                        </td>

                        <td
                          style={{
                            padding: '12px 16px',
                            color: 'var(--color-text-muted)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {a.city || a.village || (isHindi ? 'क्लस्टर' : 'Cluster')},{' '}
                          {a.state}
                        </td>

                        <td
                          style={{
                            padding: '12px 16px',
                            fontWeight:
                              'var(--weight-semibold)',
                            textAlign: 'center',
                          }}
                        >
                          {liveCount}
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontWeight:
                                'var(--weight-semibold)',
                            }}
                          >
                            <Star
                              size={14}
                              fill="#F59E0B"
                              color="#F59E0B"
                              aria-hidden="true"
                            />

                            {a.rating || 4.8}
                          </span>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 10px',
                              borderRadius: 999,
                              fontSize: 'var(--text-xs)',
                              fontWeight:
                                'var(--weight-semibold)',
                              background: a.verified
                                ? 'var(--color-success-bg)'
                                : 'var(--color-warning-bg)',
                              color: a.verified
                                ? 'var(--color-success)'
                                : 'var(--color-warning)',
                            }}
                          >
                            {a.verified
                              ? t('admin.verified')
                              : t('admin.unverified')}
                          </span>
                        </td>

                        <td
                          style={{
                            padding: '12px 16px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedArtisan(a);
                              }}
                              aria-label={`View profile for ${a.name}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '5px 10px',
                                borderRadius: 6,
                                border:
                                  '1px solid var(--color-border)',
                                background:
                                  'var(--color-surface)',
                                color:
                                  'var(--color-primary)',
                                fontSize: 'var(--text-xs)',
                                fontWeight:
                                  'var(--weight-medium)',
                                cursor: 'pointer',
                              }}
                            >
                              <Eye size={13} />
                              {t('admin.viewDetails')}
                            </button>

                            <button
                              type="button"
                              disabled={updatingId === a.id}
                              onClick={(e) => handleToggleVerification(a, e)}
                              aria-label={a.verified ? t('admin.unverifyArtisan') : t('admin.verifyArtisan')}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '5px 10px',
                                borderRadius: 6,
                                border: a.verified
                                  ? '1px solid #FCD34D'
                                  : '1px solid var(--color-primary)',
                                background: a.verified
                                  ? '#FFFBEB'
                                  : 'var(--color-primary-light)',
                                color: a.verified
                                  ? '#B45309'
                                  : 'var(--color-primary)',
                                fontSize: 'var(--text-xs)',
                                fontWeight: 'var(--weight-semibold)',
                                cursor: updatingId === a.id ? 'not-allowed' : 'pointer',
                                opacity: updatingId === a.id ? 0.6 : 1,
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {updatingId === a.id ? (
                                <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
                              ) : a.verified ? (
                                <>
                                  <ShieldOff size={13} />
                                  {t('admin.revoke')}
                                </>
                              ) : (
                                <>
                                  <CheckCircle size={13} />
                                  {t('admin.verify')}
                                </>
                              )}
                            </button>
                          </div>
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
          {isHindi ? `${artisanList.length} में से ${filtered.length} कारीगर दिख रहे हैं` : `Showing ${filtered.length} of ${artisanList.length} artisans`}
        </p>

        {/* Artisan Detail Modal */}
        {selectedArtisan && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="artisan-modal-title"
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
            onClick={() => setSelectedArtisan(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--color-surface)',
                borderRadius: 16,
                maxWidth: 520,
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
                onClick={() => setSelectedArtisan(null)}
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
                  alignItems: 'center',
                  marginBottom: 20,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background:
                      'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'var(--weight-bold)',
                    fontSize: 'var(--text-xl)',
                    flexShrink: 0,
                  }}
                >
                  {selectedArtisan.name?.[0] || 'A'}
                </span>

                <div>
                  <h3
                    id="artisan-modal-title"
                    style={{
                      fontSize: 'var(--text-xl)',
                      fontWeight: 'var(--weight-bold)',
                      color: 'var(--color-text)',
                      margin: '0 0 4px',
                    }}
                  >
                    {selectedArtisan.name}
                  </h3>

                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-primary)',
                        fontWeight:
                          'var(--weight-semibold)',
                        background:
                          'var(--color-primary-light)',
                        padding: '2px 8px',
                        borderRadius: 999,
                      }}
                    >
                      {selectedArtisan.craft}
                    </span>

                    <span
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: selectedArtisan.verified
                          ? 'var(--color-success)'
                          : 'var(--color-warning)',
                      }}
                    >
                      {selectedArtisan.verified
                        ? (isHindi ? '✓ सत्यापित साथी' : '✓ Verified Partner')
                        : (isHindi ? '• सत्यापन लंबित' : '• Verification Pending')}
                    </span>
                  </div>
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
                      color: 'var(--color-text-muted)',
                      display: 'block',
                    }}
                  >
                    {isHindi ? 'स्थान:' : 'Location:'}
                  </span>

                  <strong
                    style={{
                      color: 'var(--color-text)',
                    }}
                  >
                    {selectedArtisan.city ||
                      selectedArtisan.village ||
                      (isHindi ? 'क्लस्टर' : 'Cluster')}
                    , {selectedArtisan.state}
                  </strong>
                </div>

                <div>
                  <span
                    style={{
                      color: 'var(--color-text-muted)',
                      display: 'block',
                    }}
                  >
                    {t('artisan.experience')}:
                  </span>

                  <strong
                    style={{
                      color: 'var(--color-text)',
                    }}
                  >
                    {selectedArtisan.experience ||
                      (isHindi ? 'अनिर्दिष्ट' : 'Not specified')}
                  </strong>
                </div>

                <div>
                  <span
                    style={{
                      color: 'var(--color-text-muted)',
                      display: 'block',
                    }}
                  >
                    {t('buyer.rating')} / {t('buyer.orders')}:
                  </span>

                  <strong
                    style={{
                      color: 'var(--color-text)',
                    }}
                  >
                    ★ {selectedArtisan.rating || 4.8} (
                    {selectedArtisan.totalOrders || 0} {t('buyer.orders')})
                  </strong>
                </div>

                <div>
                  <span
                    style={{
                      color: 'var(--color-text-muted)',
                      display: 'block',
                    }}
                  >
                    {t('admin.productsCatalogued')}:
                  </span>

                  <strong
                    style={{
                      color: 'var(--color-text)',
                    }}
                  >
                    {artisanProducts.length ||
                      selectedArtisan.published ||
                      0}{' '}
                    {isHindi ? 'सक्रिय लिस्टिंग' : 'active listings'}
                  </strong>
                </div>
              </div>

              {selectedArtisan.bio && (
                <div style={{ marginBottom: 16 }}>
                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-muted)',
                      fontWeight:
                        'var(--weight-semibold)',
                    }}
                  >
                    {isHindi ? 'कारीगर की कहानी / परिचय' : 'Artisan Story / Bio'}
                  </span>

                  <p
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--color-text)',
                      lineHeight: 1.5,
                      margin: '4px 0 0',
                    }}
                  >
                    {isHindi && selectedArtisan.bioHindi ? selectedArtisan.bioHindi : selectedArtisan.bio}
                  </p>
                </div>
              )}

              {/* Products by this artisan */}
              <div style={{ marginBottom: 20 }}>
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-muted)',
                    fontWeight:
                      'var(--weight-semibold)',
                    display: 'block',
                    marginBottom: 8,
                  }}
                >
                  {t('admin.productsCatalogued')} (
                  {artisanProducts.length})
                </span>

                {artisanProducts.length === 0 ? (
                  <p
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-muted)',
                      fontStyle: 'italic',
                    }}
                  >
                    {isHindi ? 'इस कारीगर द्वारा अभी तक कोई उत्पाद कैटलॉग नहीं किया गया है।' : 'No products catalogued yet by this artisan.'}
                  </p>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      maxHeight: 160,
                      overflowY: 'auto',
                    }}
                  >
                    {artisanProducts.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 10px',
                          background: 'var(--color-bg)',
                          borderRadius: 6,
                          fontSize: 'var(--text-xs)',
                        }}
                      >
                        <span
                          style={{
                            fontWeight:
                              'var(--weight-medium)',
                            color: 'var(--color-text)',
                          }}
                        >
                          {isHindi && p.titleHindi ? p.titleHindi : p.title}
                        </span>

                        <span
                          style={{
                            fontWeight:
                              'var(--weight-semibold)',
                            color:
                              'var(--color-primary)',
                          }}
                        >
                          ₹
                          {p.price?.toLocaleString(
                            'en-IN'
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Artisan Verification Governance */}
              <div
                style={{
                  background: selectedArtisan.verified
                    ? 'var(--color-success-bg)'
                    : 'var(--color-warning-bg)',
                  border: selectedArtisan.verified
                    ? '1.5px solid var(--color-success)'
                    : '1.5px solid #FCD34D',
                  borderRadius: 10,
                  padding: '14px 16px',
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: '1 1 200px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginBottom: 4,
                      }}
                    >
                      <ShieldCheck
                        size={16}
                        color={
                          selectedArtisan.verified
                            ? 'var(--color-success)'
                            : 'var(--color-warning)'
                        }
                      />
                      <span
                        style={{
                          fontSize: 'var(--text-xs)',
                          fontWeight: 'var(--weight-bold)',
                          color: selectedArtisan.verified
                            ? 'var(--color-success)'
                            : 'var(--color-warning)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {t('admin.artisanGovernance')}
                      </span>
                    </div>

                    <p
                      style={{
                        margin: 0,
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-text)',
                        lineHeight: 1.4,
                      }}
                    >
                      {selectedArtisan.verified
                        ? t('artisan.statusVerifiedDesc')
                        : t('artisan.statusUnverifiedDesc')}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={updatingId === selectedArtisan.id}
                    onClick={() => handleToggleVerification(selectedArtisan)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: 'none',
                      background: selectedArtisan.verified
                        ? '#DC2626'
                        : 'var(--color-primary)',
                      color: '#fff',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 'var(--weight-bold)',
                      cursor:
                        updatingId === selectedArtisan.id
                          ? 'not-allowed'
                          : 'pointer',
                      opacity: updatingId === selectedArtisan.id ? 0.7 : 1,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      transition: 'background 0.15s ease',
                      flexShrink: 0,
                    }}
                  >
                    {updatingId === selectedArtisan.id ? (
                      <Loader2
                        size={14}
                        style={{ animation: 'spin 0.8s linear infinite' }}
                      />
                    ) : selectedArtisan.verified ? (
                      <>
                        <ShieldOff size={14} />
                        {t('admin.unverifyArtisan')}
                      </>
                    ) : (
                      <>
                        <CheckCircle size={14} />
                        {t('admin.verifyArtisan')}
                      </>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedArtisan(null)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'var(--color-primary)',
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