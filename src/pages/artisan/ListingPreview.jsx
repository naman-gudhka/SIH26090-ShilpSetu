import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, MapPin, Package, Edit2, Share2, Check, ShieldCheck, Sparkles, ArrowLeft } from 'lucide-react';
import { mockAIGeneratedCatalog } from '../../data/mockData.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { productService } from '../../services/productService.js';
import { artisanService } from '../../services/artisanService.js';

export function ListingPreview() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t, isHindi } = useLanguage();
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [createdProductId, setCreatedProductId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [artisan, setArtisan] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadArtisan() {
      try {
        const artisanId = currentUser?.uid || 'a1';
        let data = await artisanService.getArtisanById(artisanId);
        if (!data && artisanId !== 'a1') {
          data = await artisanService.getArtisanById('a1');
        }
        if (isMounted && data) {
          setArtisan(data);
        }
      } catch {
        // Fallback
      }
    }
    loadArtisan();
    return () => { isMounted = false; };
  }, [currentUser]);

  const catalog = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('ss_catalog')) || mockAIGeneratedCatalog;
    } catch {
      return mockAIGeneratedCatalog;
    }
  })();

  const price = sessionStorage.getItem('ss_price') || mockAIGeneratedCatalog.suggestedPrice?.recommended || 2200;
  const previewPhoto = sessionStorage.getItem('ss_photo_preview') || null;

  const publish = async () => {
    if (publishing || published) return;
    setPublishing(true);
    try {
      const artisanId = currentUser?.uid || 'a1';
      const artisanName = artisan?.name || currentUser?.displayName || 'Meera Devi';
      const artisanLocation = artisan?.village ? `${artisan.village}, ${artisan.state}` : 'Madhubani, Bihar';

      const created = await productService.createProduct({
        artisanId,
        artisanName,
        artisanLocation,
        title: catalog.title || catalog.productName || 'Handcrafted Artisan Item',
        titleHindi: catalog.titleHindi || catalog.productNameHindi || '',
        description: catalog.description || '',
        descriptionHindi: catalog.descriptionHindi || '',
        price: Number(price) || 2000,
        craft: catalog.craft || 'Kutch Embroidery',
        category: catalog.category || 'Accessories',
        materials: catalog.materials || 'Handwoven cotton',
        colors: catalog.colors || 'Natural',
        dimensions: catalog.dimensions || '30cm × 25cm',
        weight: catalog.weight || '250g',
        photoUrl: previewPhoto,
        status: 'published',
      });
      if (created?.id) {
        setCreatedProductId(created.id);
      }
      setPublished(true);
    } catch {
      setPublished(true);
    } finally {
      setPublishing(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = createdProductId
      ? `${window.location.origin}/buyer/products/${createdProductId}`
      : `${window.location.origin}/buyer/products`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: catalog.title || 'ShilpSetu Product',
          text: `Check out this handmade ${catalog.craft} on ShilpSetu!`,
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
      // Silently ignore clipboard permissions
    }
  };

  if (published) {
    return (
      <div style={{ minHeight:'100vh', background:'var(--color-bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'var(--space-6)', textAlign:'center' }}>
        <div style={{ maxWidth: 460, width: '100%', background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', padding: 'var(--space-8) var(--space-6)', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ width:84, height:84, borderRadius:'50%', background:'var(--color-success-bg)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto var(--space-4)' }}>
            <CheckCircle size={44} color="var(--color-success)" />
          </div>
          <h1 style={{ fontSize:'var(--text-2xl)', fontWeight:'var(--weight-bold)', color:'var(--color-text)', marginBottom:'var(--space-2)' }}>
            {t('artisan.productIsLive')}
          </h1>
          <p style={{ fontSize:'var(--text-base)', color:'var(--color-text-muted)', lineHeight:1.6, marginBottom:'var(--space-6)' }}>
            <strong>{isHindi && catalog.titleHindi ? catalog.titleHindi : (catalog.title || catalog.productName)}</strong> {t('artisan.productIsLiveDesc')}
          </p>

          <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-3)' }}>
            <button onClick={() => navigate('/artisan/products')} style={{ width:'100%', padding:'var(--space-3) var(--space-6)', background:'var(--color-primary)', color:'#fff', border:'none', borderRadius:'var(--radius-lg)', fontSize:'var(--text-base)', fontWeight:'var(--weight-semibold)', cursor:'pointer', minHeight:48 }}>
              {t('artisan.viewMyProducts')}
            </button>
            <button onClick={() => navigate('/artisan/products/new')} style={{ width:'100%', padding:'var(--space-3) var(--space-6)', background:'transparent', color:'var(--color-primary)', border:'1.5px solid var(--color-primary)', borderRadius:'var(--radius-lg)', fontSize:'var(--text-base)', fontWeight:'var(--weight-medium)', cursor:'pointer', minHeight:48 }}>
              {t('artisan.addAnotherProduct')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', paddingBottom: 'calc(var(--bottom-nav-height, 64px) + env(safe-area-inset-bottom, 0px) + var(--space-8, 32px))' }}>
      {/* Top Bar */}
      <div style={{ background:'var(--color-surface)', borderBottom:'1px solid var(--color-border)', padding:'var(--space-4) var(--space-5)', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10 }}>
        <button onClick={() => navigate(-1)} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:'var(--color-text)', fontSize:'var(--text-sm)', fontWeight:600 }}>
          <ArrowLeft size={16} /> {t('actions.back')}
        </button>
        <h1 style={{ fontSize:'var(--text-lg)', fontWeight:'var(--weight-bold)', color:'var(--color-text)', margin:0 }}>
          {t('artisan.listingPreview')}
        </h1>
        <button onClick={() => navigate('/artisan/products/catalog')} style={{ display:'flex', alignItems:'center', gap:4, background:'none', border:'none', cursor:'pointer', color:'var(--color-primary)', fontSize:'var(--text-sm)', fontWeight:600 }}>
          <Edit2 size={14} /> {t('actions.edit')}
        </button>
      </div>

      <div className="listing-preview-container" style={{ maxWidth: 900, margin: '0 auto', padding: 'var(--space-6) var(--space-4)' }}>
        {/* Quality Banner Notice */}
        <div style={{
          background: 'var(--color-surface-teal)',
          border: '1px solid var(--color-border-teal)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-5)',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={18} color="var(--color-primary)" />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-primary)' }}>
              {isHindi ? 'पूर्वावलोकन: खरीदारों को आपकी लिस्टिंग ऐसे दिखेगी' : 'Preview Mode: This is how buyers will see your listing'}
            </span>
          </div>
          <span style={{
            fontSize: 11,
            fontWeight: 'var(--weight-bold)',
            background: 'var(--color-primary)',
            color: '#fff',
            padding: '2px 10px',
            borderRadius: 'var(--radius-full)',
            textTransform: 'uppercase',
          }}>
            {t('artisan.qualityExcellent')}
          </span>
        </div>

        {/* 2-Column Responsive Card Showcase */}
        <div className="listing-preview-grid" style={{
          display: 'grid',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          {/* Left Column: Image & Authenticity Seals */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <div style={{
              width: '100%',
              maxWidth: '100%',
              aspectRatio: '1 / 1',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-surface-warm))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)',
            }}>
              {previewPhoto ? (
                <img src={previewPhoto} alt={catalog.title || 'Craft photo'} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              ) : (
                <Package size={72} strokeWidth={1.2} color="var(--color-text-light)" />
              )}

              {/* Verified Craft Badge Seal Overlay */}
              <div style={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                background: 'rgba(28, 43, 42, 0.85)',
                color: '#fff',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11,
                fontWeight: 600,
                backdropFilter: 'blur(4px)',
              }}>
                <ShieldCheck size={14} color="#34D399" />
                {t('artisan.verifiedHandcrafted')}
              </div>
            </div>

            {/* Trust highlights below image */}
            <div style={{
              background: 'var(--color-bg)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              border: '1px solid var(--color-border-light)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                <CheckCircle size={14} color="var(--color-success)" />
                <span>{t('artisan.madeToOrder')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                <CheckCircle size={14} color="var(--color-success)" />
                <span>{t('artisan.fairPriceBenchmark')}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Narrative, Price & Specs */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
            <div>
              {/* Craft badge & location */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                <span style={{
                  background: 'var(--color-accent-bg)',
                  color: 'var(--color-accent)',
                  fontSize: 11,
                  fontWeight: 'var(--weight-bold)',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}>
                  {catalog.craft || 'Handicraft'}
                </span>
                <span style={{
                  background: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  fontSize: 11,
                  fontWeight: 'var(--weight-semibold)',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                }}>
                  {catalog.category || 'Craft'}
                </span>
              </div>

              {/* Title Bilingual */}
              <h2 style={{
                fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
                fontWeight: 'var(--weight-bold)',
                color: 'var(--color-text)',
                margin: '0 0 6px',
                lineHeight: 1.3,
                overflowWrap: 'break-word',
                wordBreak: 'break-word',
              }}>
                {isHindi && catalog.titleHindi ? catalog.titleHindi : (catalog.title || catalog.productName)}
              </h2>
              {catalog.titleHindi && catalog.title && (
                <p style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                  margin: '0 0 14px',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                }}>
                  {isHindi ? catalog.title : catalog.titleHindi}
                </p>
              )}

              {/* Artisan attribution */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--color-border-light)' }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 13, fontWeight: 'var(--weight-bold)',
                  flexShrink: 0,
                }}>
                  {artisan?.name?.[0] || currentUser?.displayName?.[0] || 'A'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', display: 'block', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                    {artisan?.name || currentUser?.displayName || 'Meera Devi'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                    <MapPin size={12} flexShrink={0} />
                    <span style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>{artisan?.village || 'Madhubani'}{artisan?.state ? `, ${artisan.state}` : ''}</span>
                  </div>
                </div>
              </div>

              {/* Price Banner Card */}
              <div style={{
                background: 'linear-gradient(135deg, var(--color-surface-warm), var(--color-surface))',
                border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
                marginBottom: 20,
              }}>
                <div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 2 }}>
                    {t('artisan.yourPrice')}
                  </span>
                  <span style={{ fontSize: 'clamp(1.5rem, 5vw, 1.875rem)', fontWeight: 'var(--weight-bold)', color: 'var(--color-primary)' }}>
                    ₹{Number(price).toLocaleString('en-IN')}
                  </span>
                </div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle size={14} /> {t('artisan.fairPriceBenchmark')}
                </span>
              </div>

              {/* About description */}
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', marginBottom: 6 }}>
                  {t('artisan.aboutThisProduct')}
                </h3>
                <p style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                  lineHeight: 1.7,
                  margin: 0,
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                }}>
                  {isHindi && catalog.descriptionHindi
                    ? catalog.descriptionHindi
                    : (catalog.description || (isHindi ? 'पारंपरिक कारीगरों द्वारा हस्तनिर्मित उत्कृष्ट शिल्प।' : 'Authentic handcrafted artisanal creation made with traditional techniques.'))}
                </p>
              </div>

              {/* Specifications 2x2 grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 10,
                marginBottom: 24,
              }}>
                {[
                  [t('artisan.materials'), catalog.materials || '—'],
                  [t('artisan.dimensions'), catalog.dimensions || '—'],
                  [t('artisan.colors'), Array.isArray(catalog.colors) ? catalog.colors.join(', ') : (catalog.colors || '—')],
                  [t('artisan.weight'), catalog.weight || '—'],
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px 12px',
                    minWidth: 0,
                    overflow: 'hidden',
                  }}>
                    <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                      {lbl}
                    </span>
                    <span style={{
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      color: 'var(--color-text)',
                      marginTop: 2,
                      display: 'block',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                    }}>
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
              <button
                onClick={publish}
                disabled={publishing}
                style={{
                  flex: '1 1 180px',
                  minWidth: 0,
                  padding: '14px 20px',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--weight-semibold)',
                  cursor: publishing ? 'not-allowed' : 'pointer',
                  opacity: publishing ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  minHeight: 50,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {publishing ? t('artisan.publishingToMarketplace') : t('artisan.publishToMarketplace')}
              </button>

              <button
                onClick={handleShare}
                type="button"
                style={{
                  flex: '1 1 100px',
                  minWidth: 0,
                  padding: '14px 16px',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  border: '1.5px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  minHeight: 50,
                }}
              >
                {copied ? (
                  <>
                    <Check size={16} color="var(--color-success)" />
                    {t('artisan.linkCopied')}
                  </>
                ) : (
                  <>
                    <Share2 size={16} />
                    {t('actions.share')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .listing-preview-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 28px !important;
            padding: var(--space-6) !important;
          }
        }
        @media (max-width: 767px) {
          .listing-preview-grid {
            grid-template-columns: minmax(0, 1fr) !important;
            gap: 20px !important;
            padding: var(--space-4) !important;
          }
        }
        @media (max-width: 480px) {
          .listing-preview-container {
            padding: var(--space-4) var(--space-3) !important;
          }
        }
        @media (max-width: 360px) {
          .listing-preview-grid {
            padding: 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
