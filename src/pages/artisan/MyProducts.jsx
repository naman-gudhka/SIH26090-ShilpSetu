import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Package, Loader2, Trash2, Edit3, Eye, EyeOff, CheckCircle, AlertCircle, X } from 'lucide-react';
import { EmptyState } from '../../components/shared/EmptyState.jsx';
import { SyncStatus } from '../../components/pwa/SyncStatus.jsx';
import { SYNC_STATUS } from '../../services/offlineSyncService.js';
import { productService } from '../../services/productService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

const TABS = ['All', 'Published', 'Draft', 'Processing'];

const STATUS_COLORS = {
  published: { bg:'var(--color-success-bg)', color:'var(--color-success)' },
  draft:     { bg:'var(--color-border-light)', color:'var(--color-text-muted)' },
  processing:{ bg:'var(--color-warning-bg)', color:'var(--color-warning)' },
  pending:   { bg:'var(--color-warning-bg)', color:'var(--color-warning)' },
};

export function MyProducts() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t, isHindi } = useLanguage();
  const [tab, setTab] = useState('All');
  const [productList, setProductList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & Feedback
  const [toast, setToast] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, product: null, isDeleting: false, error: '' });
  const [editModal, setEditModal] = useState({ isOpen: false, product: null, title: '', price: '', isSaving: false, error: '' });
  const [statusTogglingId, setStatusTogglingId] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  };

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const artisanId = currentUser?.uid || 'a1';
        const data = await productService.getProducts();
        if (isMounted) {
          const myData = data.filter((p) => p.artisanId === artisanId || (artisanId === 'a1' && !p.artisanId));
          setProductList(myData);
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [currentUser]);

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!deleteModal.product) return;
    setDeleteModal((p) => ({ ...p, isDeleting: true, error: '' }));
    try {
      await productService.deleteProduct(deleteModal.product.id);
      setProductList((prev) => prev.filter((item) => item.id !== deleteModal.product.id));
      setDeleteModal({ isOpen: false, product: null, isDeleting: false, error: '' });
      showToast('Listing deleted successfully', 'success');
    } catch (err) {
      setDeleteModal((p) => ({ ...p, isDeleting: false, error: err.message || 'Failed to delete' }));
    }
  };

  // Edit Action
  const handleOpenEdit = (p, e) => {
    e.stopPropagation();
    setEditModal({
      isOpen: true,
      product: p,
      title: p.title || '',
      price: String(p.price || ''),
      isSaving: false,
      error: '',
    });
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editModal.product) return;
    if (!editModal.title.trim()) {
      setEditModal((p) => ({ ...p, error: 'Title is required' }));
      return;
    }
    const numPrice = Number(editModal.price);
    if (!numPrice || numPrice <= 0) {
      setEditModal((p) => ({ ...p, error: 'Please enter a valid price' }));
      return;
    }

    setEditModal((p) => ({ ...p, isSaving: true, error: '' }));
    try {
      const updated = await productService.updateProduct(editModal.product.id, {
        title: editModal.title.trim(),
        price: numPrice,
      });
      setProductList((prev) =>
        prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
      );
      setEditModal({ isOpen: false, product: null, title: '', price: '', isSaving: false, error: '' });
      showToast('Product updated successfully', 'success');
    } catch (err) {
      setEditModal((p) => ({ ...p, isSaving: false, error: err.message || 'Failed to update' }));
    }
  };

  // Status Toggle Action
  const handleToggleStatus = async (product, e) => {
    e.stopPropagation();
    if (statusTogglingId) return;

    const nextStatus = product.status === 'published' ? 'draft' : 'published';
    setStatusTogglingId(product.id);
    try {
      const updated = await productService.updateProduct(product.id, { status: nextStatus });
      setProductList((prev) =>
        prev.map((item) => (item.id === updated.id ? { ...item, status: nextStatus } : item))
      );
      showToast(
        nextStatus === 'published' ? 'Product published to store' : 'Product moved to drafts',
        'success'
      );
    } catch {
      showToast('Failed to change status. Please retry.', 'error');
    } finally {
      setStatusTogglingId(null);
    }
  };

  const displayed = tab === 'All'
    ? productList
    : productList.filter((p) => p.status === tab.toLowerCase());

  const tabLabels = {
    All: t('artisan.filterAll'),
    Published: t('artisan.filterPublished'),
    Draft: t('artisan.filterDraft'),
    Processing: t('status.processing'),
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--color-bg)', paddingBottom:100 }}>
      {/* Feedback Toast */}
      {toast && (
        <div
          role="status"
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            background: toast.type === 'error' ? 'var(--color-error)' : 'var(--color-text)',
            color: '#fff',
            borderRadius: 'var(--radius-md)',
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} color="var(--color-primary)" />}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', marginLeft: 8 }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ background:'var(--color-surface)', borderBottom:'1px solid var(--color-border)', padding:'var(--space-4) var(--space-5)' }}>
        <div style={{ maxWidth:'var(--max-content-width)', margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h1 style={{ fontSize:'var(--text-xl)', fontWeight:'var(--weight-bold)', color:'var(--color-text)' }}>
            {t('nav.myProducts')}
          </h1>
          <button onClick={() => navigate('/artisan/products/new')}
            style={{ display:'flex', alignItems:'center', gap:'var(--space-1)', padding:'var(--space-2) var(--space-4)', background:'var(--color-primary)', color:'#fff', border:'none', borderRadius:'var(--radius-full)', cursor:'pointer', fontSize:'var(--text-sm)', fontWeight:'var(--weight-semibold)' }}>
            <Plus size={16} /> {t('nav.addProduct')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background:'var(--color-surface)', borderBottom:'1px solid var(--color-border)' }}>
        <div style={{ maxWidth:'var(--max-content-width)', margin:'0 auto', display:'flex', overflowX:'auto', padding:'0 var(--space-2)' }}>
          {TABS.map((tabKey) => {
            const count = tabKey === 'All' ? productList.length : productList.filter((p) => p.status === tabKey.toLowerCase()).length;
            const active = tab === tabKey;
            return (
              <button key={tabKey} onClick={() => setTab(tabKey)}
                style={{ padding:'var(--space-3) var(--space-4)', border:'none', borderBottom:`2.5px solid ${active?'var(--color-primary)':'transparent'}`, background:'transparent', color:active?'var(--color-primary)':'var(--color-text-muted)', fontWeight:active?'var(--weight-semibold)':'var(--weight-regular)', fontSize:'var(--text-sm)', cursor:'pointer', whiteSpace:'nowrap', minHeight:44, display:'flex', alignItems:'center', gap:'var(--space-1)' }}>
                {tabLabels[tabKey] || tabKey}
                <span style={{ background:active?'var(--color-primary-light)':'var(--color-border-light)', color:active?'var(--color-primary)':'var(--color-text-muted)', borderRadius:'var(--radius-full)', padding:'1px 7px', fontSize:'var(--text-xs)', fontWeight:'var(--weight-semibold)' }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div
      style={{
        maxWidth: 'var(--max-content-width)',
        margin: '0 auto',
        padding: 'var(--space-4) var(--space-5)',
      }}
    >
  {loading ? (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-12)',
        gap: 8,
        color: 'var(--color-text-muted)',
      }}
    >
      <Loader2
        size={24}
        style={{ animation: 'spin 0.8s linear infinite' }}
      />
      <span>
        {t('artisan.loadingProducts') || 'Loading products…'}
      </span>
    </div>
  ) : displayed.length === 0 ? (
    <EmptyState
      icon={Package}
      title={t('artisan.noProductsCategory') || 'No products in this category'}
      description={
        t('artisan.noProductsDesc') ||
        "Tap 'Add Product' to create your next handmade listing."
      }
      action={{
        label: t('nav.addProduct') || 'Add Product',
        onClick: () => navigate('/artisan/products/new'),
      }}
    />
  ) : (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
      }}
    >
      {displayed.map((p) => {
        const s = STATUS_COLORS[p.status] || STATUS_COLORS.draft;
        const imgUrl = p.images?.[0] || p.photoUrl;
        const isToggling = statusTogglingId === p.id;

        return (
          <div
            key={p.id}
            onClick={() => navigate(`/artisan/products/${p.id}`)}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              cursor: 'pointer',
              transition: 'transform 0.15s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 'var(--radius-md)',
                background:
                  'linear-gradient(135deg,var(--color-primary-light),var(--color-surface-warm))',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {imgUrl ? (
                <img
                  src={imgUrl}
                  alt={p.title || 'Product'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <Package
                  size={28}
                  strokeWidth={1.5}
                  color="var(--color-text-light)"
                />
              )}
            </div>

            <div
              style={{
                flex: 1,
                minWidth: 180,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <p
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--weight-semibold)',
                    color: 'var(--color-text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    margin: 0,
                    flex: 1,
                  }}
                >
                  {isHindi && p.titleHindi
                    ? p.titleHindi
                    : p.title || 'Untitled product'}
                </p>

                {p.isLocalDemo && (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      background: 'var(--color-primary-light)',
                      color: 'var(--color-primary)',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 4,
                      flexShrink: 0,
                    }}
                  >
                    {isHindi ? 'नया' : 'NEW'}
                  </span>
                )}
              </div>

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
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--weight-bold)',
                    color: 'var(--color-primary)',
                  }}
                >
                  ₹{Number(p.price || 0).toLocaleString('en-IN')}
                </span>

                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--weight-semibold)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: s.bg,
                    color: s.color,
                    textTransform: 'capitalize',
                  }}
                >
                  {t(`status.${p.status}`) || p.status}
                </span>

                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {p.craft}
                </span>
              </div>
            </div>

            {/* Actions Bar */}
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-1)',
                marginLeft: 'auto',
              }}
            >
              {p.status === 'draft' && (
                <SyncStatus status={SYNC_STATUS.SAVED_LOCALLY} />
              )}

              {/* Publish / Unpublish */}
              <button
                type="button"
                onClick={(e) => handleToggleStatus(p, e)}
                disabled={isToggling}
                title={
                  p.status === 'published'
                    ? t('actions.unpublish') || 'Unpublish listing'
                    : t('actions.publish') || 'Publish listing'
                }
                aria-label={
                  p.status === 'published'
                    ? t('actions.unpublish') || 'Unpublish listing'
                    : t('actions.publish') || 'Publish listing'
                }
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color:
                    p.status === 'published'
                      ? 'var(--color-text-muted)'
                      : 'var(--color-primary)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--weight-medium)',
                  cursor: isToggling ? 'not-allowed' : 'pointer',
                  opacity: isToggling ? 0.6 : 1,
                  minHeight: 34,
                }}
              >
                {isToggling ? (
                  <Loader2
                    size={14}
                    style={{
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                ) : p.status === 'published' ? (
                  <>
                    <EyeOff size={14} />
                    {t('actions.unpublish') || 'Unpublish'}
                  </>
                ) : (
                  <>
                    <Eye size={14} />
                    {t('actions.publish') || 'Publish'}
                  </>
                )}
              </button>

              {/* Quick Edit */}
              <button
                type="button"
                onClick={(e) => handleOpenEdit(p, e)}
                title={t('actions.edit') || 'Edit title & price'}
                aria-label={t('actions.edit') || 'Edit title and price'}
                style={{
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--weight-medium)',
                  cursor: 'pointer',
                  minHeight: 34,
                }}
              >
                <Edit3 size={14} />
                {t('actions.edit') || 'Edit'}
              </button>

              {/* Delete */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteModal({
                    isOpen: true,
                    product: p,
                    isDeleting: false,
                    error: '',
                  });
                }}
                title={t('actions.delete') || 'Delete listing'}
                aria-label={t('actions.delete') || 'Delete listing'}
                style={{
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #FECACA',
                  background: 'var(--color-error-bg)',
                  color: 'var(--color-error)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  minHeight: 34,
                  minWidth: 34,
                }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  )}
</div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.product && (
        <>
          <div
            onClick={() => !deleteModal.isDeleting && setDeleteModal({ isOpen: false, product: null, isDeleting: false, error: '' })}
            style={{ position: 'fixed', inset: 0, background: 'rgba(28, 43, 42, 0.45)', zIndex: 1200, backdropFilter: 'blur(3px)' }}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Confirm deletion"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1201,
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-xl)',
              width: 'min(90vw, 420px)',
              padding: 'var(--space-5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-error)', marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-error-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash2 size={18} />
              </div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', margin: 0 }}>
                Delete Listing?
                {t('artisan.deleteListing')}
              </h2>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: 16 }}>
              Are you sure you want to delete <strong>"{deleteModal.product.title}"</strong>? This item will be permanently removed from your catalog and marketplace.
              {isHindi
                ? `क्या आप वाकई "${deleteModal.product.title}" को हटाना चाहते हैं? यह आपके कैटलॉग से स्थायी रूप से हटा दिया जाएगा।`
                : `Are you sure you want to delete "${deleteModal.product.title}"? This item will be permanently removed from your catalog and marketplace.`}
            </p>

            {deleteModal.error && (
              <div style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)', padding: '8px 12px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', marginBottom: 16 }}>
                {deleteModal.error}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, product: null, isDeleting: false, error: '' })}
                disabled={deleteModal.isDeleting}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  background: 'transparent',
                  color: 'var(--color-text)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--weight-medium)',
                  cursor: 'pointer',
                  minHeight: 40,
                }}
              >
                Cancel
                {t('actions.cancel')}
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteModal.isDeleting}
                style={{
                  padding: '8px 18px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: 'var(--color-error)',
                  color: '#fff',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--weight-semibold)',
                  cursor: deleteModal.isDeleting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  minHeight: 40,
                  opacity: deleteModal.isDeleting ? 0.7 : 1,
                }}
              >
                {deleteModal.isDeleting ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Trash2 size={16} />}
                {deleteModal.isDeleting ? 'Deleting…' : 'Delete Product'}
                {deleteModal.isDeleting ? (isHindi ? 'हटाया जा रहा है…' : 'Deleting…') : t('actions.delete')}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Quick Edit Modal */}
      {editModal.isOpen && editModal.product && (
        <>
          <div
            onClick={() => !editModal.isSaving && setEditModal({ isOpen: false, product: null, title: '', price: '', isSaving: false, error: '' })}
            style={{ position: 'fixed', inset: 0, background: 'rgba(28, 43, 42, 0.45)', zIndex: 1200, backdropFilter: 'blur(3px)' }}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Edit product details"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1201,
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-xl)',
              width: 'min(90vw, 440px)',
              padding: 'var(--space-5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Edit3 size={18} color="var(--color-primary)" />
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', margin: 0 }}>
                  Edit Product
                </h2>
              </div>
              <button
                onClick={() => setEditModal({ isOpen: false, product: null, title: '', price: '', isSaving: false, error: '' })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {editModal.error && (
                <div style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)', padding: '8px 12px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)' }}>
                  {editModal.error}
                </div>
              )}

              <div>
                <label htmlFor="edit-product-title" style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', marginBottom: 6 }}>
                  Product Title *
                </label>
                <input
                  id="edit-product-title"
                  type="text"
                  value={editModal.title}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, title: e.target.value, error: '' }))}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--color-border)',
                    fontSize: 'var(--text-sm)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label htmlFor="edit-product-price" style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', marginBottom: 6 }}>
                  Price (₹) *
                </label>
                <input
                  id="edit-product-price"
                  type="number"
                  min="1"
                  step="1"
                  value={editModal.price}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, price: e.target.value, error: '' }))}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--color-border)',
                    fontSize: 'var(--text-sm)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setEditModal({ isOpen: false, product: null, title: '', price: '', isSaving: false, error: '' })}
                  disabled={editModal.isSaving}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    background: 'transparent',
                    color: 'var(--color-text)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--weight-medium)',
                    cursor: 'pointer',
                    minHeight: 40,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editModal.isSaving}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: 'var(--color-primary)',
                    color: '#fff',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--weight-semibold)',
                    cursor: editModal.isSaving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    minHeight: 40,
                    opacity: editModal.isSaving ? 0.7 : 1,
                  }}
                >
                  {editModal.isSaving ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : null}
                  {editModal.isSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
