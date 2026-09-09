import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNetwork } from '../../context/NetworkContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Camera, Package, Clock, CheckCircle, ChevronRight, Store, TrendingUp, MessageSquare, ExternalLink, ArrowRight } from 'lucide-react';
import { productService } from '../../services/productService.js';
import { enquiryService } from '../../services/enquiryService.js';
import { artisanService } from '../../services/artisanService.js';

function StatCard({ icon: Icon, label, value, color = 'var(--color-primary)' }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-3)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      minWidth: 0,
    }}>
      <div style={{
        width: 38,
        height: 38,
        borderRadius: 'var(--radius-md)',
        background: color + '18',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        flexShrink: 0,
      }}>
        <Icon size={18} />
      </div>
      <div style={{ minWidth: 0, overflow: 'hidden' }}>
        <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', lineHeight: 1.1 }}>
          {value}
        </p>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {label}
        </p>
      </div>
    </div>
  );
}

function ProductStatusBadge({ status }) {
  const { t } = useLanguage();
  const config = {
    published: { bg: 'var(--color-success-bg)', color: 'var(--color-success)', key: 'status.published', defaultLabel: 'Published' },
    draft: { bg: 'var(--color-border-light)', color: 'var(--color-text-muted)', key: 'status.draft', defaultLabel: 'Draft' },
    processing: { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', key: 'status.processing', defaultLabel: 'Processing' },
    pending: { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', key: 'status.pending', defaultLabel: 'Pending' },
  };
  const c = config[status] || config.draft;
  return (
    <span style={{
      display: 'inline-block',
      background: c.bg,
      color: c.color,
      fontSize: 10,
      fontWeight: 'var(--weight-semibold)',
      padding: '2px 8px',
      borderRadius: 'var(--radius-full)',
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
    }}>
      {t(c.key) || c.defaultLabel}
    </span>
  );
}


export function ArtisanHome() {
  const { currentUser } = useAuth();
  const { isOnline } = useNetwork();
  const { t, isHindi } = useLanguage();
  const navigate = useNavigate();

  const [myProducts, setMyProducts] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [artisanProfile, setArtisanProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const artisanId = currentUser?.uid || 'a1';
        let artData = await artisanService.getArtisanById(artisanId);
        if (!artData) {
          if (artisanId !== 'a1') {
            artData = await artisanService.updateArtisan(artisanId, {
              name: currentUser?.displayName || 'Artisan Partner',
              verified: false,
            });
          } else {
            artData = await artisanService.getArtisanById('a1');
          }
        } else if (artisanId !== 'a1') {
          artData = {
            ...artData,
            verified: Boolean(artData.verified === true),
          };
        }

        const [allProds, enqs] = await Promise.all([
          productService.getProducts(),
          enquiryService.getEnquiriesByArtisan(artisanId),
        ]);

        if (isMounted) {
          const userProds = (allProds || []).filter(
            (p) => p.artisanId === artisanId || (artisanId === 'a1' && (!p.artisanId || p.artisanId === 'a1'))
          );
          setMyProducts(userProds);
          setEnquiries(enqs || []);
          if (artData) {
            setArtisanProfile(artData);
          }
        }
      } catch (_error) {
        // Graceful fallback
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadData();

    const handleArtisansChanged = (e) => {
      const { id, artisan, updates } = e.detail || {};
      const currentArtisanId = currentUser?.uid || 'a1';
      if (id === currentArtisanId || (currentArtisanId === 'a1' && id === 'a1')) {
        if (isMounted) {
          setArtisanProfile((prev) => (artisan ? { ...prev, ...artisan } : { ...prev, ...updates }));
        }
      }
    };
    window.addEventListener('shilpsetu_artisans_changed', handleArtisansChanged);

    return () => {
      isMounted = false;
      window.removeEventListener('shilpsetu_artisans_changed', handleArtisansChanged);
    };
  }, [currentUser]);

  const published = myProducts.filter(p => p.status === 'published').length;
  const drafts = myProducts.filter(p => p.status === 'draft').length;
  const processing = myProducts.filter(p => p.status === 'processing').length;

  const firstName = currentUser?.displayName?.split(' ')[0] || (isHindi ? 'कारीगर' : 'Artisan');
  const hour = new Date().getHours();
  const greeting = hour < 12
    ? (isHindi ? 'सुप्रभात' : 'Good morning')
    : hour < 17
    ? (isHindi ? 'नमस्ते' : 'Good afternoon')
    : (isHindi ? 'शुभ संध्या' : 'Good evening');

  return (
    <div style={{
      background: 'var(--color-bg)',
      minHeight: '100vh',
      paddingBottom: 'calc(var(--bottom-nav-height) + var(--space-6))',
    }}>
      {/* Header strip */}
      <div style={{
        background: 'var(--color-surface)',
        padding: 'var(--space-5) var(--space-4) var(--space-6)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div style={{ maxWidth: 'var(--max-content-width)', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-1)',
          }}>
            <div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                {greeting},
              </p>
              <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', marginTop: 2 }}>
                {firstName} 🙏
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 'var(--weight-semibold)',
                    background: artisanProfile?.verified
                      ? 'var(--color-success-bg)'
                      : 'var(--color-warning-bg)',
                    color: artisanProfile?.verified
                      ? 'var(--color-success)'
                      : 'var(--color-warning)',
                    border: artisanProfile?.verified
                      ? '1px solid var(--color-success)'
                      : '1px solid #FCD34D',
                  }}
                >
                  {artisanProfile?.verified ? (
                    <>
                      <CheckCircle size={11} />
                      {t('buyer.verifiedArtisan')}
                    </>
                  ) : (
                    <>
                      <Clock size={11} />
                      {t('artisan.unverifiedBadge')}
                    </>
                  )}
                </span>
                
              </div>
            </div>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 'var(--text-xl)',
              fontWeight: 'var(--weight-bold)',
            }}>
              {firstName[0]}
            </div>
          </div>

          {/* Online status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: isOnline ? 'var(--color-success)' : 'var(--color-text-muted)',
            }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              {isOnline ? (isHindi ? 'ऑनलाइन — सिंक हो गया' : 'Online — synced') : (isHindi ? 'ऑफ़लाइन — स्थानीय रूप से सुरक्षित' : 'Offline — working locally')}
            </span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 'var(--max-content-width)', margin: '0 auto', padding: 'var(--space-5) var(--space-4)' }}>

        {/* Hero Action — Add Product */}
        <div style={{
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-6)',
          marginBottom: 'var(--space-5)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -20, right: -20,
            width: 100, height: 100, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }} />
          <div style={{
            position: 'absolute', bottom: -30, right: 20,
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          }} />

          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}>
            {t('artisan.readyToCatalogue')}
          </p>
          <h2 style={{ color: '#fff', fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-4)' }}>
            {t('nav.addProduct')}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <button
              onClick={() => navigate('/artisan/products/photo')}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1.5px solid rgba(255,255,255,0.4)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                transition: 'all var(--transition-fast)',
                backdropFilter: 'blur(4px)',
                width: '100%',
              }}
            >
              <Camera size={22} />
              <div style={{ textAlign: 'left', flex: 1 }}>
                <p style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', margin: 0 }}>
                  {t('artisan.takePhoto')}
                </p>
                <p style={{ fontSize: 11, opacity: 0.75, margin: 0 }}>
                  {isHindi ? 'फ़ोटो → कहानी → AI — एक-एक कदम' : 'Photo → Story → AI — step by step'}
                </p>
              </div>
              <ArrowRight size={16} style={{ opacity: 0.8 }} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="artisan-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
          <StatCard icon={CheckCircle} label={t('status.published')} value={published} color="var(--color-success)" />
          <StatCard icon={Package} label={t('artisan.draftProducts')} value={drafts} color="var(--color-warning)" />
          <StatCard icon={Clock} label={t('status.processing')} value={processing} color="var(--color-secondary)" />
        </div>

        {/* Store completion */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Store size={18} style={{ color: 'var(--color-primary)' }} />
              <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>
                {t('artisan.storeAlmostReady')}
              </span>
            </div>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)', fontWeight: 'var(--weight-semibold)' }}>
              {published >= 3 ? '100%' : '75%'}
            </span>
          </div>
          <div style={{ height: 6, background: 'var(--color-border-light)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: published >= 3 ? '100%' : '75%',
              background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
              borderRadius: 4,
              transition: 'width 1s ease',
            }} />
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
            {published >= 3
              ? t('artisan.storeFullyReady')
              : (isHindi
                ? `विशेष स्थान पाने के लिए ${Math.max(1, 3 - published)} और उत्पाद जोड़ें`
                : `Add ${Math.max(1, 3 - published)} more product${3 - published === 1 ? '' : 's'} to unlock featured placement`)}
          </p>
        </div>

        {/* Recent Products */}
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>
              {t('nav.myProducts')}
            </h3>
            <button
              onClick={() => navigate('/artisan/products')}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                color: 'var(--color-primary)', fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-medium)', background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              {t('artisan.viewAll')} <ChevronRight size={16} />
            </button>
          </div>

          {myProducts.length === 0 ? (
            <div style={{
              background: 'var(--color-surface)',
              border: '2px dashed var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-8)',
              textAlign: 'center',
            }}>
              <Package size={40} style={{ color: 'var(--color-border)', margin: '0 auto var(--space-3)' }} />
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                {t('artisan.noProductsYetDesc')}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {myProducts.slice(0, 4).map((product) => {
                const imgUrl = product.images?.[0] || product.photoUrl;
                return (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/artisan/products/${product.id}`)}
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 'var(--space-3) var(--space-4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      cursor: 'pointer',
                      transition: 'box-shadow var(--transition-fast)',
                    }}
                  >
                    {/* Image thumbnail or placeholder */}
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 'var(--radius-md)',
                        background:
                          'linear-gradient(135deg, var(--color-primary-light), var(--color-secondary-light))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        overflow: 'hidden',
                      }}
                    >
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={product.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <Package size={20} style={{ color: 'var(--color-primary)' }} />
                      )}
                    </div>

                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <p
                        style={{
                          fontSize: 'var(--text-sm)',
                          fontWeight: 'var(--weight-semibold)',
                          color: 'var(--color-text)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          margin: 0,
                        }}
                      >
                        {isHindi && product.titleHindi ? product.titleHindi : product.title}
                      </p>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-2)',
                          marginTop: 4,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 'var(--text-sm)',
                            color: 'var(--color-primary)',
                            fontWeight: 'var(--weight-semibold)',
                          }}
                        >
                          ₹{Number(product.price).toLocaleString('en-IN')}
                        </span>
                        <ProductStatusBadge status={product.status} />
                      </div>
                    </div>

                    <ChevronRight
                      size={16}
                      style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Customer Enquiries & Leads Inbox */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <MessageSquare size={20} style={{ color: 'var(--color-secondary)' }} />
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', margin: 0 }}>
                {t('artisan.customerEnquiries')}
              </h3>
            </div>
            {enquiries.length > 0 && (
              <span style={{
                background: 'var(--color-secondary-light)',
                color: 'var(--color-secondary)',
                borderRadius: 'var(--radius-full)',
                padding: '2px 10px',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-bold)',
              }}>
                {enquiries.length} {enquiries.length === 1 ? t('artisan.lead') : t('artisan.leads')}
              </span>
            )}
          </div>

          {loading ? (
            <div style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              textAlign: 'center',
            }}>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', margin: 0 }}>
                {t('artisan.loadingEnquiries')}
              </p>
            </div>
          ) : enquiries.length === 0 ? (
            <div style={{
              background: 'var(--color-surface)',
              border: '1px dashed var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              textAlign: 'center',
            }}>
              <MessageSquare size={32} style={{ color: 'var(--color-border)', margin: '0 auto var(--space-2)' }} />
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', margin: 0 }}>
                {t('artisan.noEnquiriesDesc')}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {enquiries.map((enq) => {
                const cleanPhone = enq.buyerContact ? enq.buyerContact.replace(/\D/g, '') : '';
                const waPhone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
                const artisanName = currentUser?.displayName || (isHindi ? 'कारीगर' : 'your artisan');
                const craftDefault = isHindi ? 'शिल्प कृति' : 'our craft piece';
                const waMsg = encodeURIComponent(
                  `Hello ${enq.buyerName}, I’m ${artisanName} regarding your ShilpSetu enquiry for "${enq.productTitle || craftDefault}".`
                );
                const hasValidPhone = cleanPhone.length >= 10;
                const enqTypeLabel = enq.type
                  ? (enq.type.toLowerCase() === 'wholesale' ? t('artisan.wholesale') : (enq.type.toLowerCase() === 'bulk' ? t('artisan.bulk') : t('artisan.retail')))
                  : t('artisan.retail');

                return (
                  <div key={enq.id} style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-3)',
                    boxShadow: 'var(--shadow-sm)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <span style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-base)', color: 'var(--color-text)' }}>
                            {enq.buyerName}
                          </span>
                          <span style={{
                            fontSize: 10,
                            fontWeight: 'var(--weight-semibold)',
                            background: 'var(--color-primary-light)',
                            color: 'var(--color-primary)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            textTransform: 'uppercase',
                          }}>
                            {enqTypeLabel}
                          </span>
                        </div>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2, marginBottom: 0 }}>
                          {t('artisan.interestedIn')} <strong style={{ color: 'var(--color-text)' }}>{enq.productTitle || (isHindi ? 'शिल्प उत्पाद' : 'Craft Product')}</strong>
                          {enq.quantity > 1 && ` · ${t('artisan.qty')} ${enq.quantity}`}
                        </p>
                      </div>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-light)', whiteSpace: 'nowrap' }}>
                        {enq.createdAt ? new Date(enq.createdAt).toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN', { month: 'short', day: 'numeric' }) : t('artisan.recent')}
                      </span>
                    </div>

                    <div style={{
                      background: 'var(--color-surface-warm)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-3)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--color-text)',
                      lineHeight: 1.5,
                      fontStyle: 'italic',
                    }}>
                      "{enq.message}"
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)', paddingTop: 'var(--space-1)' }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                        {t('artisan.contact')} <strong>{enq.buyerContact || t('artisan.notProvided')}</strong>
                      </span>

                      {hasValidPhone ? (
                        <a
                          href={`https://wa.me/${waPhone}?text=${waMsg}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: '#25D366',
                            color: '#FFFFFF',
                            padding: '6px 14px',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 'var(--weight-semibold)',
                            textDecoration: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <ExternalLink size={13} />
                          {t('artisan.replyOnWhatsApp')}
                        </a>
                      ) : (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-light)', fontStyle: 'italic' }}>
                          {t('artisan.whatsappUnavailable')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Guidance tip */}
        <div style={{
          background: 'var(--color-surface-teal)',
          border: '1px solid var(--color-border-teal)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)',
          display: 'flex',
          gap: 'var(--space-3)',
          alignItems: 'flex-start',
        }}>
          <TrendingUp size={18} style={{ color: 'var(--color-primary)', marginTop: 2, flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-primary)' }}>
              {t('artisan.tipPhotoHeading')}
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>
              {t('artisan.tipPhotoDesc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
