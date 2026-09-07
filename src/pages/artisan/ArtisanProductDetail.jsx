import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  CheckCircle,
  Clock,
  Edit2,
  Trash2,
  FileText,
  Tag,
  Loader2,
  AlertCircle,
  Share2,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { productService } from '../../services/productService.js';

export function ArtisanProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t, isHindi } = useLanguage();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    price: '',
    description: '',
    craft: '',
  });

  useEffect(() => {
    let active = true;
    async function fetchProduct() {
      setLoading(true);
      try {
        const data = await productService.getProductById(id);
        if (active) {
          setProduct(data);
          if (data) {
            setEditForm({
              title: data.title || '',
              price: String(data.price || ''),
              description: data.description || '',
              craft: data.craft || '',
            });
          }
        }
      } catch (err) {
        if (active) setError(err.message || 'Failed to load product');
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchProduct();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <main
        style={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          color: 'var(--color-text-muted)',
        }}
      >
        <Loader2 size={28} style={{ animation: 'spin 0.8s linear infinite' }} />
        <span>{t('artisan.loadingDetails')}</span>
      </main>
    );
  }

  if (!product) {
    return (
      <main style={{ maxWidth: 640, margin: '2rem auto', padding: '1rem', textAlign: 'center' }}>
        <Package size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>
          {t('artisan.productNotFound')}
        </h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
          {t('artisan.productNotFoundDesc')}
        </p>
        <button
          onClick={() => navigate('/artisan/products')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {t('artisan.backToProducts')}
        </button>
      </main>
    );
  }

  // Ownership verification check
  const isOwner =
    !product.artisanId ||
    product.artisanId === currentUser?.uid ||
    product.artisanId === 'a1' ||
    product.isLocalDemo;

  if (!isOwner) {
    return (
      <main style={{ maxWidth: 640, margin: '3rem auto', padding: '1.5rem', textAlign: 'center' }}>
        <AlertCircle size={48} color="var(--color-error)" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>
          {t('artisan.accessRestricted')}
        </h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
          {t('artisan.accessRestrictedDesc')}
        </p>
        <button
          onClick={() => navigate('/artisan/products')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {t('artisan.backToProducts')}
        </button>
      </main>
    );
  }

  const handleToggleStatus = async () => {
    setActionLoading(true);
    const newStatus = product.status === 'published' ? 'draft' : 'published';
    try {
      const updated = await productService.updateProduct(product.id, {
        status: newStatus,
      });
      setProduct(updated);
    } catch (err) {
      setError(err.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) return;
    setActionLoading(true);
    try {
      const updated = await productService.updateProduct(product.id, {
        title: editForm.title.trim(),
        price: Number(editForm.price) || product.price,
        description: editForm.description.trim(),
        craft: editForm.craft.trim() || product.craft,
      });
      setProduct(updated);
      setShowEditModal(false);
    } catch (err) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await productService.deleteProduct(product.id);
      navigate('/artisan/products', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to delete product');
      setActionLoading(false);
    }
  };

  const handleShare = async () => {
    const publicProductUrl = `${window.location.origin}/buyer/products/${product.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: isHindi && product.titleHindi ? product.titleHindi : product.title,
          text: `Check out this handcrafted ${product.craft || 'piece'} on ShilpSetu:`,
          url: publicProductUrl,
        });
        return;
      } catch {
        // Fallback to clipboard if share was dismissed or unsupported
      }
    }
    try {
      await navigator.clipboard.writeText(publicProductUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Silently ignore clipboard write failures
    }
  };

  const imageUrl = product.images?.[0] || product.photoUrl;

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--color-bg)',
        paddingBottom: 'calc(var(--bottom-nav-height, 64px) + env(safe-area-inset-bottom, 0px) + var(--space-8, 32px))',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          padding: 'var(--space-4) var(--space-5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <button
          onClick={() => navigate('/artisan/products')}
          aria-label="Back to products"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--color-text)',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            padding: '4px 8px',
            borderRadius: 8,
          }}
        >
          <ArrowLeft size={18} />
          {t('artisan.backToProducts')}
        </button>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleShare}
            aria-label={copied ? (t('artisan.linkCopied') || 'Link Copied!') : (t('actions.share') || 'Share')}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
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
      </div>

      <div
        className="artisan-product-detail-container"
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: 'var(--space-6) var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Owner Notice Banner */}
        <div
          style={{
            background: 'var(--color-surface-teal)',
            border: '1px solid var(--color-border-teal)',
            borderRadius: 12,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {product.status === 'published' ? (
              <CheckCircle size={20} color="var(--color-primary)" />
            ) : (
              <Clock size={20} color="var(--color-text-muted)" />
            )}
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 'var(--text-sm)',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                }}
              >
                {t('artisan.ownerNotice')}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-muted)',
                }}
              >
                Status:{' '}
                <strong style={{ textTransform: 'capitalize' }}>
                  {t(`status.${product.status}`) || product.status}
                </strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleToggleStatus}
              disabled={actionLoading}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: 'none',
                background:
                  product.status === 'published'
                    ? 'var(--color-border)'
                    : 'var(--color-primary)',
                color:
                  product.status === 'published'
                    ? 'var(--color-text)'
                    : '#fff',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {product.status === 'published'
                ? t('actions.unpublish')
                : t('actions.publish')}
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: '1.5px solid var(--color-primary)',
                background: 'transparent',
                color: 'var(--color-primary)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Edit2 size={12} />
              {t('actions.edit')}
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 10,
              padding: '0.75rem 1rem',
              color: '#B91C1C',
              fontSize: '0.875rem',
            }}
          >
            {error}
          </div>
        )}

        {/* Main Product Layout */}
        <div
          className="artisan-product-detail-grid"
          style={{
            display: 'grid',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          }}
        >
          {/* Product Image */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
            <div
              style={{
                width: '100%',
                maxWidth: '100%',
                aspectRatio: '1 / 1',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                background:
                  'linear-gradient(135deg, var(--color-primary-light), var(--color-surface-warm))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={product.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Package size={64} color="var(--color-text-light)" />
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', maxWidth: '100%' }}>
                {product.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${product.title} thumbnail ${idx + 1}`}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 8,
                      objectFit: 'cover',
                      border: '1px solid var(--color-border)',
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Info & Specs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  borderRadius: 99,
                  background: 'var(--color-surface-teal)',
                  color: 'var(--color-primary)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                <Tag size={12} />
                {product.craft}
              </div>
              <h1
                style={{
                  fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                  margin: '0 0 6px',
                  lineHeight: 1.3,
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                }}
              >
                {isHindi && product.titleHindi ? product.titleHindi : product.title}
              </h1>
              {product.titleHindi && !isHindi && (
                <p
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-muted)',
                    margin: '0 0 12px',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                  }}
                >
                  {product.titleHindi}
                </p>
              )}
              <p
                style={{
                  fontSize: 'clamp(1.5rem, 5vw, 1.875rem)',
                  fontWeight: 800,
                  color: 'var(--color-primary)',
                  margin: '8px 0',
                }}
              >
                ₹{Number(product.price).toLocaleString('en-IN')}
              </p>
            </div>

            {/* Description */}
            <div>
              <h3
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                  marginBottom: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <FileText size={16} />
                {t('artisan.craftStory')}
              </h3>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                  lineHeight: 1.6,
                  margin: 0,
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                }}
              >
                {isHindi && product.descriptionHindi
                  ? product.descriptionHindi
                  : product.description}
              </p>
            </div>

            {/* Specifications Grid */}
            <div
              style={{
                borderTop: '1px solid var(--color-border-light)',
                paddingTop: 16,
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 10,
              }}
            >
              {[
                [
                  t('artisan.materials'),
                  Array.isArray(product.materials)
                    ? product.materials.join(', ')
                    : product.materials || 'Handmade',
                ],
                [t('artisan.dimensions'), product.dimensions || 'Standard'],
                [t('artisan.weight'), product.weight || '300g'],
                [
                  t('artisan.colors'),
                  Array.isArray(product.colors)
                    ? product.colors.join(', ')
                    : product.colors || 'Natural',
                ],
              ].map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                    minWidth: 0,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--color-text-muted)',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    {k}
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 600,
                      color: 'var(--color-text)',
                      lineHeight: 1.4,
                      display: 'block',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                    }}
                  >
                    {v}
                  </span>
                </div>
              ))}
            </div>

            {/* Delete button */}
            <div style={{ marginTop: 'auto', paddingTop: 16 }}>
              <button
                onClick={() => setShowDeleteModal(true)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #FECACA',
                  background: '#FEF2F2',
                  color: '#B91C1C',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Trash2 size={14} />
                {t('actions.delete')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit Product"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: 16,
              padding: '1.75rem',
              width: '100%',
              maxWidth: 480,
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            }}
          >
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--color-text)',
                margin: '0 0 1rem',
              }}
            >
              {t('artisan.editProduct')}
            </h2>
            <form
              onSubmit={handleSaveEdit}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <div>
                <label
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  {isHindi ? t('artisan.productNameHi') : t('artisan.productNameEn')}
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, title: e.target.value }))
                  }
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: 8,
                    border: '1.5px solid var(--color-border)',
                    boxSizing: 'border-box',
                    fontSize: '0.95rem',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  {t('artisan.yourPrice')} (₹)
                </label>
                <input
                  type="number"
                  value={editForm.price}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, price: e.target.value }))
                  }
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: 8,
                    border: '1.5px solid var(--color-border)',
                    boxSizing: 'border-box',
                    fontSize: '0.95rem',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  {isHindi ? t('artisan.descriptionHi') : t('artisan.descriptionEn')}
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, description: e.target.value }))
                  }
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: 8,
                    border: '1.5px solid var(--color-border)',
                    boxSizing: 'border-box',
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 10,
                  marginTop: 10,
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: 8,
                    border: '1px solid var(--color-border)',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {t('actions.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: 8,
                    border: 'none',
                    background: 'var(--color-primary)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {actionLoading ? t('artisan.saving') : t('artisan.saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Delete"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: 16,
              padding: '1.75rem',
              width: '100%',
              maxWidth: 400,
              textAlign: 'center',
            }}
          >
            <AlertCircle
              size={44}
              color="var(--color-error)"
              style={{ margin: '0 auto 12px' }}
            />
            <h3
              style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                color: 'var(--color-text)',
                margin: '0 0 8px',
              }}
            >
              {t('artisan.deleteConfirm')}
            </h3>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--color-text-muted)',
                marginBottom: 20,
              }}
            >
              {t('artisan.deleteConfirmMsg')}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: 10,
                  border: '1px solid var(--color-border)',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {t('actions.cancel')}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={actionLoading}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: 10,
                  border: 'none',
                  background: 'var(--color-error)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {actionLoading ? t('artisan.deleting') : t('actions.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .artisan-product-detail-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 24px !important;
            padding: var(--space-6) !important;
          }
        }
        @media (max-width: 767px) {
          .artisan-product-detail-grid {
            grid-template-columns: minmax(0, 1fr) !important;
            gap: 20px !important;
            padding: var(--space-4) !important;
          }
        }
        @media (max-width: 480px) {
          .artisan-product-detail-container {
            padding: var(--space-4) var(--space-3) !important;
          }
        }
        @media (max-width: 360px) {
          .artisan-product-detail-grid {
            padding: 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
