import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, MapPin, ChevronRight, X, CheckCircle, Send, AlertCircle, Share2, Check } from 'lucide-react';
import { products as initialProducts, artisans as initialArtisans } from '../../data/mockData.js';
import { productService } from '../../services/productService.js';
import { artisanService } from '../../services/artisanService.js';
import { enquiryService } from '../../services/enquiryService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

/** Declared at module scope — not inside render — to satisfy react-hooks/static-components */
function ImagePlaceholder({ large = false, craft = '' }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: '100%',
        aspectRatio: large ? '4/3' : '1/1',
        background: 'linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-surface-teal) 60%, var(--color-border-light) 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-3)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <Package size={large ? 56 : 40} style={{ color: 'var(--color-primary)', opacity: 0.4 }} />
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>{craft}</span>
    </div>
  );
}

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t, isHindi } = useLanguage();

  const [product, setProduct] = useState(() => initialProducts.find((p) => p.id === id) || null);
  const [artisan, setArtisan] = useState(() => {
    const prod = initialProducts.find((p) => p.id === id);
    return prod ? initialArtisans.find((a) => a.id === prod.artisanId) || null : null;
  });

  const [activeImage, setActiveImage] = useState(0);
  const [copied, setCopied] = useState(false);

  // Enquiry modal state
  const [showModal, setShowModal] = useState(false);
  const [enquirySuccess, setEnquirySuccess] = useState(false);
  const [buyerName, setBuyerName] = useState('');
  const [buyerContact, setBuyerContact] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [enquiryError, setEnquiryError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const prod = await productService.getProductById(id);
        if (isMounted && prod) {
          setProduct(prod);
          const art = await artisanService.getArtisanById(prod.artisanId);
          if (isMounted && art) {
            setArtisan(art);
          }
        }
      } catch {
        // Fallback to initial
      }
    }
    loadData();

    const handleArtisansChanged = (e) => {
      const { id: changedId, artisan: updatedArt, updates } = e.detail || {};
      if (isMounted) {
        setArtisan((prev) => {
          if (prev && prev.id === changedId) {
            return updatedArt ? { ...prev, ...updatedArt } : { ...prev, ...updates };
          }
          return prev;
        });
      }
    };
    window.addEventListener('shilpsetu_artisans_changed', handleArtisansChanged);

    return () => {
      isMounted = false;
      window.removeEventListener('shilpsetu_artisans_changed', handleArtisansChanged);
    };
  }, [id]);

  const handleOpenEnquiry = () => {
    let defaultName = currentUser?.displayName || '';
    let defaultContact = currentUser?.email || '';
    try {
      const savedProfile = localStorage.getItem('shilpsetu_buyer_profile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed.name && !defaultName) defaultName = parsed.name;
      }
    } catch {
      // Ignore
    }
    setBuyerName((prev) => prev || defaultName);
    setBuyerContact((prev) => prev || defaultContact);
    const prodTitle = isHindi && product?.titleHindi ? product.titleHindi : product?.title;
    setMessage((prev) => prev || (product ? (isHindi ? `नमस्ते, मुझे "${prodTitle}" खरीदने में रुचि है। क्या आप उपलब्धता और डिलीवरी के बारे में विवरण साझा कर सकते हैं?` : `Hello, I am interested in purchasing "${prodTitle}". Could you share details regarding availability and delivery?`) : ''));
    setEnquirySuccess(false);
    setEnquiryError('');
    setShowModal(true);
  };

  const handleSendEnquiry = async (e) => {
    e.preventDefault();
    if (!buyerName.trim()) {
      setEnquiryError(t('buyer.errNameRequired'));
      return;
    }
    if (!buyerContact.trim()) {
      setEnquiryError(t('buyer.errContactRequired'));
      return;
    }

    setSubmitting(true);
    setEnquiryError('');
    try {
      await enquiryService.createEnquiry({
        name: buyerName.trim(),
        contact: buyerContact.trim(),
        buyerId: currentUser?.uid || null,
        productId: product?.id,
        productTitle: isHindi && product?.titleHindi ? product.titleHindi : product?.title,
        artisanId: product?.artisanId || 'a1',
        artisanName: artisan?.name || product?.artisanName,
        quantity,
        message: message.trim(),
        type: 'retail',
      });
      setEnquirySuccess(true);
    } catch (err) {
      setEnquiryError(err?.message || (isHindi ? 'पूछताछ भेजने में असमर्थ। पुनः प्रयास करें।' : 'Failed to send enquiry. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/buyer/products/${product?.id || id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: isHindi && product?.titleHindi ? product.titleHindi : product?.title || 'Handmade Craft',
          text: `Check out ${product?.title || 'this craft'} on ShilpSetu:`,
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

  /* ── Not found state ── */
  if (!product) {
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
        <h2 style={{ color: 'var(--color-text)' }}>{t('artisan.productNotFound')}</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>
          {t('artisan.productNotFoundDesc')}
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/buyer/products')}>
          {t('buyer.browseProducts')}
        </button>
      </div>
    );
  }

  const displayArtisan = artisan || initialArtisans.find((a) => a.id === product.artisanId);

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(product.price);

  const imageList = product.images && product.images.length > 0 ? product.images : [];
  const currentImageSrc = imageList[activeImage];

  return (
    <>
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

        {/* ── Layout wrapper (mobile: column, desktop: 2-column grid) ── */}
        <div
          className="product-detail-layout"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 'var(--space-6)',
            maxWidth: '1200px',
            margin: '0 auto',
            padding: 'var(--space-6) var(--page-padding) var(--space-8)',
            boxSizing: 'border-box',
          }}
        >
          {/* ─── Image gallery column ─── */}
          <div
            className="product-detail-gallery"
            style={{
              width: '100%',
              maxWidth: '360px',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
            aria-label="Product images"
          >
            {currentImageSrc ? (
              <div
                style={{
                  width: '100%',
                  maxWidth: '360px',
                  aspectRatio: '1 / 1',
                  maxHeight: '360px',
                  borderRadius: 'var(--radius-xl)',
                  overflow: 'hidden',
                  background: 'var(--color-surface-warm)',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={currentImageSrc}
                  alt={isHindi && product.titleHindi ? product.titleHindi : product.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>
            ) : (
              <div style={{ width: '100%', maxWidth: '360px' }}>
                <ImagePlaceholder large craft={product.craft} />
              </div>
            )}

            {/* Dot indicators */}
            {imageList.length > 1 && (
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-2)',
                  justifyContent: 'center',
                  marginTop: 'var(--space-1)',
                }}
                role="group"
                aria-label="Image navigation"
              >
                {imageList.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    aria-label={`View image ${i + 1}`}
                    aria-pressed={activeImage === i}
                    style={{
                      width: activeImage === i ? 22 : 8,
                      height: 8,
                      borderRadius: 'var(--radius-full)',
                      border: 'none',
                      background: activeImage === i ? 'var(--color-primary)' : 'var(--color-border)',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'all var(--transition-fast)',
                      minHeight: 'unset',
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ─── Info column ─── */}
          <div
            className="product-detail-info"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-5)',
              minWidth: 0,
            }}
          >
            {/* Craft badge + title + price */}
            <div>
              <span className="badge badge-accent" style={{ marginBottom: 'var(--space-3)', display: 'inline-flex' }}>
                {product.craft}
              </span>
              <h1 style={{
                fontSize: 'var(--text-2xl)',
                lineHeight: 1.2,
                color: 'var(--color-text)',
                marginBottom: 'var(--space-3)',
                overflowWrap: 'break-word',
                wordBreak: 'break-word',
              }}>
                {isHindi && product.titleHindi ? product.titleHindi : product.title}
              </h1>
              <p
                style={{
                  fontSize: 'var(--text-3xl)',
                  fontWeight: 'var(--weight-bold)',
                  color: 'var(--color-primary)',
                }}
                aria-label={`Price: ${formattedPrice}`}
              >
                {formattedPrice}
              </p>
            </div>

            {/* Materials */}
            {product.materials?.length > 0 && (
              <div>
                <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t('artisan.materials')}
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  {product.materials.map((mat) => (
                    <span
                      key={mat}
                      style={{
                        background: 'var(--color-surface-warm)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-full)',
                        padding: 'var(--space-1) var(--space-3)',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-text)',
                        overflowWrap: 'break-word',
                        wordBreak: 'break-word',
                      }}
                    >
                      {mat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div>
                <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t('buyer.aboutThisPiece')}
                </h2>
                <p style={{
                  fontSize: 'var(--text-base)',
                  color: 'var(--color-text)',
                  lineHeight: 1.7,
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                }}>
                  {isHindi && product.descriptionHindi ? product.descriptionHindi : product.description}
                </p>
              </div>
            )}

            {/* Dimensions & Weight */}
            {(product.dimensions || product.weight) && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 'var(--space-3)',
                }}
              >
                {product.dimensions && (
                  <div
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-3) var(--space-4)',
                      minWidth: 0,
                      overflow: 'hidden',
                    }}
                  >
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
                      {t('artisan.dimensions')}
                    </p>
                    <p style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--weight-semibold)',
                      color: 'var(--color-text)',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                    }}>
                      {product.dimensions}
                    </p>
                  </div>
                )}
                {product.weight && (
                  <div
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-3) var(--space-4)',
                      minWidth: 0,
                      overflow: 'hidden',
                    }}
                  >
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
                      {t('artisan.weight')}
                    </p>
                    <p style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--weight-semibold)',
                      color: 'var(--color-text)',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                    }}>
                      {product.weight}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Artisan card */}
            {displayArtisan && (
              <div
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-4)',
                }}
              >
                {/* Avatar */}
                <div
                  aria-hidden="true"
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-surface-teal))',
                    border: '2px solid var(--color-border-teal)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--text-xl)',
                    fontWeight: 'var(--weight-bold)',
                    color: 'var(--color-primary)',
                    flexShrink: 0,
                  }}
                >
                  {displayArtisan.name?.charAt(0) || 'A'}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
                    {t('buyer.createdBy')}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <p style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', margin: 0 }}>
                      {displayArtisan.name}
                    </p>
                    {displayArtisan.verified ? (
                      <span className="badge badge-success" style={{ fontSize: '10px', padding: '1px 6px' }}>
                        {t('buyer.verifiedArtisan')}
                      </span>
                    ) : (
                      <span className="badge badge-warning" style={{ fontSize: '10px', padding: '1px 6px' }}>
                        {t('buyer.unverifiedArtisan')}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginTop: 'var(--space-1)' }}>
                    <MapPin size={12} style={{ color: 'var(--color-text-muted)' }} aria-hidden="true" />
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {displayArtisan.city || displayArtisan.village}, {displayArtisan.state}
                    </span>
                  </div>
                  <span className="badge badge-primary" style={{ marginTop: 'var(--space-2)' }}>
                    {displayArtisan.craft}
                  </span>
                </div>

                <Link
                  to={`/buyer/artisans/${displayArtisan.id}`}
                  aria-label={`View ${displayArtisan.name}'s artisan story`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-1)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-primary)',
                    fontWeight: 'var(--weight-medium)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {t('buyer.viewStory')}
                  <ChevronRight size={14} aria-hidden="true" />
                </Link>
              </div>
            )}

            {/* Desktop CTA (hidden on mobile, shown on desktop) */}
            <div className="product-desktop-cta" style={{ marginTop: 'var(--space-2)' }}>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleOpenEnquiry}
                aria-label={t('buyer.sendEnquiry')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'var(--space-2)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--weight-bold)',
                  padding: 'var(--space-4)',
                }}
              >
                <Send size={18} />
                {t('buyer.sendEnquiry')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky bottom bar (mobile only) ── */}
      <div
        className="product-mobile-bottom-bar"
        style={{
          position: 'fixed',
          bottom: 'var(--bottom-nav-height)',
          left: 0,
          right: 0,
          background: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          padding: 'var(--space-3) var(--page-padding)',
          zIndex: 40,
          boxShadow: '0 -4px 12px rgba(28,43,42,0.08)',
        }}
        aria-label="Actions bar"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', maxWidth: 'var(--max-content-width)', margin: '0 auto' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: 0 }}>{t('buyer.price')}</p>
            <p style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-primary)', margin: 0 }}>
              {formattedPrice}
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleOpenEnquiry}
            aria-label={t('buyer.sendEnquiry')}
            style={{ flex: '0 0 auto', padding: 'var(--space-3) var(--space-8)' }}
          >
            {t('buyer.sendEnquiry')}
          </button>
        </div>
      </div>

      {/* ── Enquiry modal ── */}
      {showModal && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowModal(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(28,43,42,0.45)',
              zIndex: 50,
              backdropFilter: 'blur(3px)',
            }}
            aria-hidden="true"
          />

          {/* Modal Content */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            style={{
              position: 'fixed',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-6)',
              width: 'min(92vw, 440px)',
              maxHeight: '90vh',
              overflowY: 'auto',
              zIndex: 51,
              boxShadow: 'var(--shadow-xl)',
              animation: 'slideUp 250ms ease',
            }}
          >
            <button
              onClick={() => setShowModal(false)}
              aria-label="Close dialog"
              style={{
                position: 'absolute',
                top: 'var(--space-4)',
                right: 'var(--space-4)',
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                padding: 'var(--space-1)',
                borderRadius: 'var(--radius-sm)',
                minHeight: 'unset',
              }}
            >
              <X size={20} aria-hidden="true" />
            </button>

            {enquirySuccess ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'var(--color-success-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto var(--space-4)',
                  }}
                  aria-hidden="true"
                >
                  <CheckCircle size={32} style={{ color: 'var(--color-success)' }} />
                </div>
                <h2 id="modal-title" style={{ fontSize: 'var(--text-xl)', color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>
                  {t('buyer.enquirySentTitle')}
                </h2>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>
                  {t('buyer.enquirySentDesc', { name: displayArtisan?.name || product.artisanName || (isHindi ? 'कारीगर' : 'the artisan') })}
                </p>
                <button
                  className="btn btn-primary btn-full"
                  onClick={() => setShowModal(false)}
                >
                  {t('buyer.done')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendEnquiry} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div>
                  <h2 id="modal-title" style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>
                    {t('buyer.sendEnquiry')}
                  </h2>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>
                    {t('buyer.forProduct', { title: isHindi && product.titleHindi ? product.titleHindi : product.title, artisan: displayArtisan?.name || product.artisanName })}
                  </p>
                </div>

                {enquiryError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-error)', fontSize: 'var(--text-xs)', background: 'var(--color-error-bg)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                    <AlertCircle size={14} />
                    <span>{enquiryError}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="enquiry-name" style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', marginBottom: 4 }}>
                    {t('buyer.yourName')}
                  </label>
                  <input
                    id="enquiry-name"
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder={t('buyer.namePlaceholder')}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      fontSize: 'var(--text-sm)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)',
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="enquiry-contact" style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', marginBottom: 4 }}>
                    {t('buyer.phoneOrEmail')}
                  </label>
                  <input
                    id="enquiry-contact"
                    type="text"
                    value={buyerContact}
                    onChange={(e) => setBuyerContact(e.target.value)}
                    placeholder={t('buyer.phoneOrEmailPlaceholder')}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      fontSize: 'var(--text-sm)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)',
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="enquiry-quantity" style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', marginBottom: 4 }}>
                    {t('buyer.quantity')}
                  </label>
                  <input
                    id="enquiry-quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      fontSize: 'var(--text-sm)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)',
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="enquiry-message" style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', marginBottom: 4 }}>
                    {t('buyer.messageToArtisan')}
                  </label>
                  <textarea
                    id="enquiry-message"
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      fontSize: 'var(--text-sm)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      resize: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowModal(false)}
                    style={{ flex: 1 }}
                  >
                    {t('actions.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                    style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <Send size={15} />
                    {submitting ? t('buyer.submittingEnquiry') : t('buyer.submitEnquiry')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}

      <style>{`
        /* Mobile styles (<1024px) */
        @media (max-width: 1023px) {
          .product-detail-layout {
            grid-template-columns: 1fr !important;
            padding-bottom: calc(var(--bottom-nav-height) + 80px) !important;
          }
          .product-desktop-cta {
            display: none !important;
          }
          .product-mobile-bottom-bar {
            display: block !important;
          }
        }

        /* Desktop styles (>=1024px) */
        @media (min-width: 1024px) {
          .product-detail-layout {
            grid-template-columns: 360px minmax(0, 1fr) !important;
            gap: var(--space-8) !important;
            align-items: start !important;
          }
          .product-detail-gallery {
            position: sticky;
            top: 24px;
          }
          .product-desktop-cta {
            display: block !important;
          }
          .product-mobile-bottom-bar {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
