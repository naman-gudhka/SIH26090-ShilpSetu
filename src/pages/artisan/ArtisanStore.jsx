import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  MapPin,
  Plus,
  ExternalLink,
  Share2,
  Check,
  Loader2,
  Edit3,
  Award,
  Sparkles,
  Clock,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { artisanService } from '../../services/artisanService.js';
import { productService } from '../../services/productService.js';

export function ArtisanStore() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t, isHindi } = useLanguage();
  const artisanId = currentUser?.uid || 'a1';

  const [artisan, setArtisan] = useState(null);
  const [storeProducts, setStoreProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadStore = async () => {
      setLoading(true);
      try {
        let [artisanData, productsData] = await Promise.all([
          artisanService.getArtisanById(artisanId),
          productService.getProducts(),
        ]);

        if (!artisanData && artisanId !== 'a1') {
          artisanData = await artisanService.updateArtisan(artisanId, {
            name: currentUser?.displayName || 'Artisan Partner',
            verified: false,
          });
        } else if (!artisanData && artisanId === 'a1') {
          artisanData = await artisanService.getArtisanById('a1');
        } else if (artisanData && artisanId !== 'a1') {
          artisanData = {
            ...artisanData,
            verified: Boolean(artisanData.verified === true),
          };
        }

        if (!mounted) return;
        setArtisan(artisanData);
        setStoreProducts(
          (productsData || []).filter(
            (product) =>
              product.artisanId === artisanId &&
              product.status === 'published',
          ),
        );
      } catch (error) {
        console.error('Failed to load artisan store:', error);
        if (mounted) {
          setArtisan(null);
          setStoreProducts([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadStore();

    const handleArtisansChanged = (e) => {
      const { id, artisan: updatedArt, updates } = e.detail || {};
      const currentArtisanId = currentUser?.uid || 'a1';
      if (id === currentArtisanId || (currentArtisanId === 'a1' && id === 'a1')) {
        if (mounted) {
          setArtisan((prev) => (updatedArt ? { ...prev, ...updatedArt } : { ...prev, ...updates }));
        }
      }
    };
    window.addEventListener('shilpsetu_artisans_changed', handleArtisansChanged);

    return () => {
      mounted = false;
      window.removeEventListener('shilpsetu_artisans_changed', handleArtisansChanged);
    };
  }, [artisanId, currentUser]);

  const publicStoreUrl = `${window.location.origin}/buyer/artisans/${artisanId}`;

  const handleShareStore = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${artisan?.name || 'Artisan'} Storefront`,
          text: `Explore authentic handmade crafts by ${
            artisan?.name || 'our artisan'
          } on ShilpSetu.`,
          url: publicStoreUrl,
        });
        return;
      } catch {
        // Fall back to clipboard.
      }
    }

    try {
      await navigator.clipboard.writeText(publicStoreUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable in some browser contexts.
    }
  };

  if (loading || !artisan) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          background: 'var(--color-bg)',
          color: 'var(--color-text-muted)',
        }}
      >
        <Loader2
          size={24}
          aria-hidden="true"
          style={{
            animation: 'spin 0.8s linear infinite',
            color: 'var(--color-primary)',
          }}
        />
        <span>{t('artisan.loadingStore') || 'Loading artisan store…'}</span>
      </div>
    );
  }

  const rating = artisan.rating || 4.9;
  const experience = artisan.experience || '5 years';
  const publishedCount =
    typeof artisan.published === 'number'
      ? artisan.published
      : storeProducts.length;

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        boxSizing: 'border-box',
        background: 'var(--color-bg)',
        paddingBottom:
          'calc(var(--bottom-nav-height) + var(--space-6))',
      }}
    >
      <header
        style={{
          background:
            'linear-gradient(135deg, #092C28 0%, #134E48 50%, #9A3412 100%)',
          padding: 'var(--space-8) var(--space-5) var(--space-6)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(10, 40, 36, 0.25)',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.08,
            backgroundImage:
              'radial-gradient(circle, #FFE4D6 1px, transparent 1px), radial-gradient(circle, #FFE4D6 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            backgroundPosition: '0 0, 12px 12px',
          }}
        />

        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-40%',
            right: '-10%',
            width: 320,
            height: 320,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(234, 88, 12, 0.25) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            maxWidth: 'var(--max-content-width)',
            margin: '0 auto',
            position: 'relative',
          }}
        >
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-4)',
                marginBottom: 'var(--space-5)',
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  width: 82,
                  height: 82,
                  borderRadius: '50%',
                  background:
                    'linear-gradient(135deg, #FFE4D6, #CCFBF1)',
                  border: '3.5px solid rgba(255, 255, 255, 0.9)',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.25rem',
                  fontWeight: 800,
                  color: '#0F766E',
                  overflow: 'hidden',
                  position: 'relative',
                  flexShrink: 0,
                }}
              >
                {artisan.photo ? (
                  <img
                    src={artisan.photo}
                    alt={artisan.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  artisan.name?.[0] || 'A'
                )}

                <div
                  title={t('artisan.verifiedHandcrafted')}
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    background: '#F59E0B',
                    color: '#fff',
                    borderRadius: '50%',
                    width: 26,
                    height: 26,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #092C28',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  }}
                >
                  <Award size={14} strokeWidth={2.5} />
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexWrap: 'wrap',
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      background: artisan?.verified
                        ? 'rgba(16, 185, 129, 0.22)'
                        : 'rgba(251, 191, 36, 0.22)',
                      border: artisan?.verified
                        ? '1px solid rgba(52, 211, 153, 0.45)'
                        : '1px solid rgba(251, 191, 36, 0.45)',
                      color: artisan?.verified ? '#A7F3D0' : '#FDE68A',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {artisan?.verified ? <Sparkles size={11} /> : <Clock size={11} />}
                    {artisan?.verified
                      ? (isHindi ? 'सत्यापित शिल्पकार' : 'Verified Maker')
                      : (isHindi ? 'सत्यापन लंबित' : 'Verification Pending')}
                  </span>
                </div>

                <h1
                  style={{
                    fontSize: 'var(--text-2xl)',
                    fontWeight: 'var(--weight-bold)',
                    color: '#FFFFFF',
                    margin: '0 0 6px',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                  }}
                >
                  {artisan.name}
                </h1>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(4px)',
                      color: '#FFFFFF',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      textTransform: 'uppercase',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                    }}
                  >
                    {artisan.craft}
                  </span>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      color: 'rgba(255, 255, 255, 0.85)',
                      fontSize: 'var(--text-xs)',
                    }}
                  >
                    <MapPin size={13} aria-hidden="true" color="#FCD34D" />
                    {artisan.village}
                    {artisan.state ? `, ${artisan.state}` : ''}
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 'var(--space-2)',
                flexWrap: 'wrap',
                marginBottom: 'var(--space-5)',
              }}
            >
              <button
                type="button"
                onClick={() => navigate('/artisan/profile')}
                style={{
                  background: 'rgba(255, 255, 255, 0.18)',
                  backdropFilter: 'blur(6px)',
                  border: '1px solid rgba(255, 255, 255, 0.35)',
                  color: '#FFFFFF',
                  padding: '8px 14px',
                  minHeight: 38,
                  borderRadius: 'var(--radius-full)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                <Edit3 size={13} aria-hidden="true" />
                {t('artisan.editProfile') || 'Edit Profile'}
              </button>

              <button
                type="button"
                onClick={handleShareStore}
                aria-label={
                  copied
                    ? t('artisan.linkCopied') || 'Store link copied'
                    : t('artisan.shareStore') || 'Share store'
                }
                style={{
                  background: copied
                    ? 'var(--color-success)'
                    : 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  color: copied ? '#FFFFFF' : '#0F766E',
                  padding: '8px 14px',
                  minHeight: 38,
                  borderRadius: 'var(--radius-full)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 'var(--text-xs)',
                  fontWeight: 700,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                }}
              >
                {copied ? (
                  <>
                    <Check size={14} aria-hidden="true" />
                    {t('artisan.linkCopied') || 'Link Copied'}
                  </>
                ) : (
                  <>
                    <Share2 size={14} aria-hidden="true" />
                    {t('artisan.shareStore') || 'Share Store'}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate(`/buyer/artisans/${artisanId}`)}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: 'rgba(255, 255, 255, 0.9)',
                  padding: '8px 12px',
                  minHeight: 38,
                  borderRadius: 'var(--radius-full)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 'var(--text-xs)',
                  fontWeight: 500,
                }}
              >
                <Eye size={13} aria-hidden="true" />
                {t('artisan.viewPublicStore') || 'View Public Store'}
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 'var(--space-2)',
                background: 'rgba(0, 0, 0, 0.2)',
                backdropFilter: 'blur(8px)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-3) var(--space-4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 'var(--text-xl)',
                    fontWeight: 'var(--weight-bold)',
                    color: '#FFFFFF',
                  }}
                >
                  {publishedCount}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    color: 'rgba(255, 255, 255, 0.75)',
                  }}
                >
                  {t('nav.products') || (isHindi ? 'उत्पाद' : 'Products')}
                </p>
              </div>

              <div
                style={{
                  textAlign: 'center',
                  borderLeft: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRight: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 'var(--text-xl)',
                    fontWeight: 'var(--weight-bold)',
                    color: '#FCD34D',
                  }}
                >
                  {rating}★
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    color: 'rgba(255, 255, 255, 0.75)',
                  }}
                >
                  {t('artisan.rating') || (isHindi ? 'रेटिंग' : 'Rating')}
                </p>
              </div>

              <div style={{ textAlign: 'center' }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--weight-bold)',
                    color: '#FFFFFF',
                    lineHeight: '26px',
                  }}
                >
                  {experience}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    color: 'rgba(255, 255, 255, 0.75)',
                  }}
                >
                  {t('artisan.experience') || (isHindi ? 'अनुभव' : 'Experience')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main
        style={{
          maxWidth: 'var(--max-content-width)',
          margin: '0 auto',
          padding: 'var(--space-5)',
        }}
      >
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <section
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-5)',
              marginBottom: 'var(--space-5)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <h2
              style={{
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--weight-bold)',
                color: 'var(--color-text)',
                margin: '0 0 var(--space-2)',
              }}
            >
              {t('artisan.aboutArtisan') || (isHindi ? 'शिल्पकार के बारे में' : 'About')}
            </h2>
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-muted)',
                lineHeight: 1.75,
                margin: 0,
              }}
            >
              {artisan.bio ||
                (isHindi
                  ? 'इस शिल्पकार की प्रामाणिक हस्तनिर्मित कलाकृतियों को देखें और उनका समर्थन करें।'
                  : 'Discover authentic handmade work from this artisan.')}
            </p>
          </section>

          <section>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--space-3)',
                marginBottom: 'var(--space-4)',
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: 'var(--text-lg)',
                    fontWeight: 'var(--weight-bold)',
                    color: 'var(--color-text)',
                    margin: 0,
                  }}
                >
                  {t('artisan.publishedListings') ||
                    (isHindi ? 'प्रकाशित उत्पाद' : 'Published Products')}
                </h2>
                <p
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-muted)',
                    margin: '2px 0 0',
                  }}
                >
                  {storeProducts.length}{' '}
                  {storeProducts.length === 1
                    ? isHindi ? 'उत्पाद लाइव' : 'product live'
                    : isHindi ? 'उत्पाद लाइव' : 'products live'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/artisan/products/new')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  minHeight: 40,
                  padding: 'var(--space-2) var(--space-4)',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  border: 0,
                  borderRadius: 'var(--radius-full)',
                  cursor: 'pointer',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--weight-semibold)',
                  flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(15, 118, 110, 0.25)',
                }}
              >
                <Plus size={15} aria-hidden="true" />
                {t('nav.addProduct') || (isHindi ? 'उत्पाद जोड़ें' : 'Add Product')}
              </button>
            </div>

            {storeProducts.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: 'var(--space-8) var(--space-5)',
                  color: 'var(--color-text-muted)',
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div
                  style={{
                    margin: '0 auto var(--space-3)',
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'var(--color-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.7,
                  }}
                >
                  <Package
                    size={28}
                    strokeWidth={1.5}
                    color="var(--color-text-muted)"
                    aria-hidden="true"
                  />
                </div>
                <p
                  style={{
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--weight-semibold)',
                    color: 'var(--color-text)',
                    margin: '0 0 4px',
                  }}
                >
                  {t('artisan.noPublishedProducts') ||
                    (isHindi ? 'अभी कोई प्रकाशित उत्पाद नहीं' : 'No published products yet')}
                </p>
                <p
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-muted)',
                    margin: '0 0 var(--space-4)',
                    maxWidth: 340,
                    marginLeft: 'auto',
                    marginRight: 'auto',
                  }}
                >
                  {t('artisan.noPublishedProductsDesc') ||
                    (isHindi
                      ? 'अपना पहला उत्पाद जोड़कर अपनी दुकान शुरू करें।'
                      : 'Add your first product to start your store.')}
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/artisan/products/new')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-primary)',
                    color: '#fff',
                    border: 'none',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {t('nav.addProduct') || (isHindi ? 'उत्पाद जोड़ें' : 'Add Product')}
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                }}
              >
                {storeProducts.map((product) => {
                  const imageUrl =
                    product.images?.[0] || product.photoUrl || '';
                  const productTitle =
                    isHindi && product.titleHindi
                      ? product.titleHindi
                      : product.title || 'Untitled product';

                  return (
                    <div
                      key={product.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Open ${productTitle}`}
                      onClick={() =>
                        navigate(`/artisan/products/${product.id}`)
                      }
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          navigate(`/artisan/products/${product.id}`);
                        }
                      }}
                      style={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-xl)',
                        padding: 'var(--space-4)',
                        display: 'flex',
                        gap: 'var(--space-3)',
                        alignItems: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      }}
                    >
                      <div
                        style={{
                          width: 68,
                          height: 68,
                          borderRadius: 'var(--radius-lg)',
                          background:
                            'linear-gradient(135deg,#CCFBF1,#FDF0E6)',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={productTitle}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <Package
                            size={28}
                            strokeWidth={1.2}
                            color="var(--color-text-light)"
                            aria-hidden="true"
                          />
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 'var(--text-sm)',
                            fontWeight: 'var(--weight-semibold)',
                            color: 'var(--color-text)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            margin: 0,
                          }}
                        >
                          {productTitle}
                        </p>

                        <p
                          style={{
                            fontSize: 'var(--text-lg)',
                            fontWeight: 'var(--weight-bold)',
                            color: 'var(--color-primary)',
                            margin: '4px 0 0',
                          }}
                        >
                          ₹{Number(product.price || 0).toLocaleString('en-IN')}
                        </p>

                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: 'var(--color-success)',
                            background: 'var(--color-success-bg)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                          }}
                        >
                          {t('status.published') ||
                            (isHindi ? 'प्रकाशित' : 'Published')}
                        </span>
                      </div>

                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'var(--color-bg)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-text-muted)',
                          flexShrink: 0,
                        }}
                      >
                        <ExternalLink size={15} aria-hidden="true" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
