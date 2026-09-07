import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ArrowRight, MessageSquare, Package, Clock, CheckCircle, Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { enquiryService } from '../../services/enquiryService.js';
import { savedItemsService } from '../../services/productService.js';
import { ProductCard } from '../../components/product/ProductCard.jsx';

export function BuyerProfile() {
  const navigate = useNavigate();
  const { currentUser, signOut } = useAuth();
  const { language, setLanguage, t, isHindi } = useLanguage();

  const [buyerProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('shilpsetu_buyer_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name) return parsed;
      }
    } catch {
      // Ignore
    }
    return { name: 'Craft Lover', language: 'en' };
  });
  const [enquiries, setEnquiries] = useState([]);
  const [savedProducts, setSavedProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('saved'); // 'saved' or 'enquiries'

  useEffect(() => {
    const userId = currentUser?.uid;
    enquiryService.getEnquiries().then((items) => {
      if (items) {
        if (userId) {
          const userEnqs = items.filter(
            (e) => e.buyerId === userId || (currentUser?.email && e.buyerContact === currentUser.email)
          );
          setEnquiries(userEnqs.length > 0 ? userEnqs : items.filter(e => !e.buyerId));
        } else {
          setEnquiries(items);
        }
      }
    }).catch(() => {});

    const loadSaved = () => {
      savedItemsService.getSavedProducts(userId).then((prods) => {
        if (prods) setSavedProducts(prods);
      }).catch(() => {});
    };

    loadSaved();

    window.addEventListener('shilpsetu_saved_items_changed', loadSaved);
    return () => window.removeEventListener('shilpsetu_saved_items_changed', loadSaved);
  }, [currentUser]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const displayName = currentUser?.displayName || buyerProfile.name || 'Craft Patron';
  const displayEmail = currentUser?.email || 'buyer@shilpsetu.in';
  const initial = displayName.charAt(0).toUpperCase() || 'B';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingBottom: 'calc(var(--bottom-nav-height) + var(--space-6))' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: 'var(--space-5)' }}>
        {/* Header Profile Info */}
        <div style={{ textAlign: 'center', padding: 'var(--space-6) 0' }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: 800,
              color: '#fff',
              margin: '0 auto var(--space-4)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {initial}
          </div>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', marginBottom: 4 }}>
            {displayName}
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>{displayEmail}</p>
        </div>

        {/* Activity summary */}
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-5)',
            marginBottom: 'var(--space-4)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', marginBottom: 'var(--space-3)' }}>
            {t('buyer.yourActivity')}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)', textAlign: 'center' }}>
            <div
              onClick={() => setActiveTab('saved')}
              style={{ cursor: 'pointer' }}
            >
              <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-primary)' }}>
                {savedProducts.length}
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{t('buyer.savedCrafts')}</p>
            </div>
            <div
              onClick={() => setActiveTab('enquiries')}
              style={{ cursor: 'pointer' }}
            >
              <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-primary)' }}>
                {enquiries.length}
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{t('buyer.myEnquiries')}</p>
            </div>
            <div>
              <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-primary)' }}>
                {enquiries.filter((e) => e.status === 'received').length}
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{t('buyer.activeOrders')}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation: Saved Crafts vs My Enquiries */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-2)',
            marginBottom: 'var(--space-4)',
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: 'var(--space-2)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('saved')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeTab === 'saved' ? 'var(--color-surface-teal)' : 'transparent',
              color: activeTab === 'saved' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontSize: 'var(--text-sm)',
              fontWeight: activeTab === 'saved' ? 'var(--weight-bold)' : 'var(--weight-medium)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all var(--transition-fast)',
            }}
          >
            <Heart size={16} style={{ fill: activeTab === 'saved' ? 'var(--color-primary)' : 'none' }} />
            {t('buyer.savedCrafts')} ({savedProducts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('enquiries')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeTab === 'enquiries' ? 'var(--color-surface-teal)' : 'transparent',
              color: activeTab === 'enquiries' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontSize: 'var(--text-sm)',
              fontWeight: activeTab === 'enquiries' ? 'var(--weight-bold)' : 'var(--weight-medium)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all var(--transition-fast)',
            }}
          >
            <MessageSquare size={16} />
            {t('buyer.myEnquiries')} ({enquiries.length})
          </button>
        </div>

        {/* Tab 1: Saved Crafts */}
        {activeTab === 'saved' && (
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-5)',
              marginBottom: 'var(--space-4)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Heart size={16} color="var(--color-secondary)" style={{ fill: 'var(--color-secondary)' }} />
                {t('buyer.savedCrafts')}
              </h2>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                {savedProducts.length} {t('actions.saved')}
              </span>
            </div>

            {savedProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-8) 0', color: 'var(--color-text-muted)' }}>
                <Heart size={36} style={{ opacity: 0.35, margin: '0 auto var(--space-2)', color: 'var(--color-secondary)' }} />
                <p style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', marginBottom: 4 }}>
                  {t('buyer.noSavedCrafts')}
                </p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', maxWidth: 300, margin: '0 auto var(--space-4)' }}>
                  {t('buyer.noSavedCraftsDesc')}
                </p>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate('/buyer/products')}
                >
                  {t('buyer.exploreCrafts')}
                </button>
              </div>
            ) : (
              <div
                className="buyer-products-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 'var(--space-4)',
                  alignItems: 'stretch',
                }}
              >
                {savedProducts.map((prod) => (
                  <div
                    key={prod.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                    }}
                  >
                    <ProductCard product={prod} compact />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Recent Enquiries */}
        {activeTab === 'enquiries' && (
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-5)',
              marginBottom: 'var(--space-4)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
              <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <MessageSquare size={16} color="var(--color-primary)" />
                {t('buyer.myEnquiries')}
              </h2>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                {enquiries.length} {isHindi ? 'कुल' : 'total'}
              </span>
            </div>

            {enquiries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-6) 0', color: 'var(--color-text-muted)' }}>
                <Package size={32} style={{ opacity: 0.4, margin: '0 auto var(--space-2)' }} />
                <p style={{ fontSize: 'var(--text-sm)' }}>{t('buyer.noEnquiriesYet')}</p>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => navigate('/buyer/products')}
                  style={{ marginTop: 'var(--space-3)' }}
                >
                  {t('buyer.browseProducts')}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {enquiries.slice(0, 5).map((enq) => (
                  <div
                    key={enq.id}
                    style={{
                      padding: 'var(--space-3)',
                      background: 'var(--color-surface-warm)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>
                        {enq.productTitle || (isHindi ? 'हस्तशिल्प पूछताछ' : 'Custom Craft Enquiry')}
                      </p>
                      <span
                        style={{
                          fontSize: 'var(--text-xs)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--color-success-bg)',
                          color: 'var(--color-success)',
                          fontWeight: 'var(--weight-medium)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        <CheckCircle size={10} /> {t('buyer.statusReceived')}
                      </span>
                    </div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {isHindi ? 'कारीगर' : 'Artisan'}: <strong style={{ color: 'var(--color-text)' }}>{enq.artisanName}</strong> • {isHindi ? 'मात्रा' : 'Qty'}: {enq.quantity || 1}
                    </p>
                    {enq.message && (
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text)', marginTop: 4, fontStyle: 'italic', background: 'rgba(255,255,255,0.7)', padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}>
                        "{enq.message}"
                      </p>
                    )}
                    <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={10} /> {new Date(enq.createdAt).toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings & Language */}
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-5)',
            marginBottom: 'var(--space-4)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', marginBottom: 'var(--space-3)' }}>
            {t('buyer.preferences')}
          </h2>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{t('buyer.changeLanguage')}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  background: language === 'en' ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: language === 'en' ? '#fff' : 'var(--color-text)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--weight-medium)',
                  cursor: 'pointer',
                }}
              >
                {t('buyer.english')}
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  background: language === 'hi' ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: language === 'hi' ? '#fff' : 'var(--color-text)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--weight-medium)',
                  cursor: 'pointer',
                }}
              >
                {t('buyer.hindi')}
              </button>
            </div>
          </div>

          {[
            { en: 'Help & Support', hi: 'सहायता एवं समर्थन' },
            { en: 'About ShilpSetu Platform', hi: 'शिल्पसेतु मंच के बारे में' },
            { en: 'Terms & Privacy', hi: 'नियम और गोपनीयता' },
          ].map((item) => (
            <div
              key={item.en}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--space-3) 0',
                borderBottom: '1px solid var(--color-border)',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{isHindi ? item.hi : item.en}</span>
              <ArrowRight size={16} color="var(--color-text-muted)" />
            </div>
          ))}
        </div>

        {/* Sign out button */}
        <button
          onClick={handleSignOut}
          className="btn btn-outline btn-full"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-2)',
            color: 'var(--color-error)',
            borderColor: 'var(--color-border)',
          }}
        >
          <LogOut size={16} />
          {t('actions.signOut')}
        </button>
      </div>
    </div>
  );
}
