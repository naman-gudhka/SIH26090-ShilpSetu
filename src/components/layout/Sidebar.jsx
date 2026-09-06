import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { authService } from '../../services/authService.js';
import {
  Home, Package, PlusCircle, Store, User, LogOut,
  LayoutDashboard, Users, BarChart2, Compass, ShoppingBag, X
} from 'lucide-react';

const artisanLinks = [
  { to: '/artisan', icon: Home, labelKey: 'nav.dashboard', label: 'Dashboard' },
  { to: '/artisan/products', icon: Package, labelKey: 'nav.myProducts', label: 'My Products' },
  { to: '/artisan/products/new', icon: PlusCircle, labelKey: 'nav.addProduct', label: 'Add Product' },
  { to: '/artisan/store', icon: Store, labelKey: 'nav.store', label: 'My Store' },
  { to: '/artisan/profile', icon: User, labelKey: 'nav.profile', label: 'Profile' },
];

const buyerLinks = [
  { to: '/buyer', icon: Home, labelKey: 'nav.home', label: 'Home' },
  { to: '/buyer/products', icon: Compass, labelKey: 'nav.explore', label: 'Explore Crafts' },
  { to: '/b2b', icon: ShoppingBag, labelKey: 'nav.b2b', label: 'Bulk Orders (B2B)' },
  { to: '/buyer/profile', icon: User, labelKey: 'nav.profile', label: 'Profile' },
];

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, labelKey: 'nav.dashboard', label: 'Dashboard' },
  { to: '/admin/artisans', icon: Users, labelKey: 'nav.artisans', label: 'Artisans' },
  { to: '/admin/products', icon: Package, labelKey: 'nav.products', label: 'Products' },
  { to: '/admin/insights', icon: BarChart2, labelKey: 'nav.insights', label: 'Insights' },
];

export function Sidebar({ onClose }) {
  const { role, currentUser, logout, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const isNavActive = (targetTo) => {
    if (targetTo === '/artisan' || targetTo === '/buyer' || targetTo === '/admin') {
      return location.pathname === targetTo;
    }
    if (targetTo === '/artisan/products/new') {
      return (
        location.pathname === '/artisan/products/new' ||
        location.pathname === '/artisan/products/photo' ||
        location.pathname === '/artisan/products/voice' ||
        location.pathname === '/artisan/products/processing' ||
        location.pathname === '/artisan/products/catalog' ||
        location.pathname === '/artisan/products/pricing' ||
        location.pathname === '/artisan/products/preview'
      );
    }
    if (targetTo === '/artisan/products') {
      const isAddFlow = (
        location.pathname.startsWith('/artisan/products/new') ||
        location.pathname.startsWith('/artisan/products/photo') ||
        location.pathname.startsWith('/artisan/products/voice') ||
        location.pathname.startsWith('/artisan/products/processing') ||
        location.pathname.startsWith('/artisan/products/catalog') ||
        location.pathname.startsWith('/artisan/products/pricing') ||
        location.pathname.startsWith('/artisan/products/preview')
      );
      return location.pathname.startsWith('/artisan/products') && !isAddFlow;
    }
    return location.pathname.startsWith(targetTo);
  };

  const links = role === 'artisan' ? artisanLinks
    : role === 'admin' ? adminLinks
    : buyerLinks;

  const sectionTitle = role === 'artisan' ? t('section.artisanStudio')
    : role === 'admin' ? t('section.adminPortal')
    : t('section.craftMarket');

  const handleLogout = async () => {
    if (onClose) onClose();
    if (logout) await logout();
    else if (signOut) await signOut();
    else if (authService?.signOut) await authService.signOut();
    navigate('/login');
  };

  return (
    <aside style={{
      width: '100%',
      maxWidth: 'var(--sidebar-width)',
      background: 'var(--color-surface)',
      borderRight: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflowY: 'auto',
      boxSizing: 'border-box',
    }}>
      {/* Header */}
      {onClose ? (
        /* Mobile slide-out drawer header */
        <div style={{
          padding: 'var(--space-4) var(--space-4)',
          borderBottom: '1px solid var(--color-border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <img src="/icons/icon-192.png" alt="ShilpSetu" width={32} height={32}
              style={{ borderRadius: 8 }} />
            <div>
              <p style={{ fontWeight: 'var(--weight-bold)', color: 'var(--color-primary)', fontSize: 'var(--text-base)', margin: 0 }}>
                ShilpSetu
              </p>
              {role && (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'capitalize', margin: 0 }}>
                  {t(`role.${role}`)}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            style={{
              padding: 'var(--space-2)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text)',
              cursor: 'pointer',
              minWidth: 44,
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>
      ) : (
        /* Desktop sidebar header: section banner without duplicating topbar logo */
        <div style={{
          padding: 'var(--space-3) var(--space-4)',
          borderBottom: '1px solid var(--color-border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 48,
          boxSizing: 'border-box',
        }}>
          <span style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-bold)',
            color: 'var(--color-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            {sectionTitle}
          </span>
          {role && (
            <span style={{
              fontSize: '10px',
              background: 'var(--color-surface-teal)',
              color: 'var(--color-primary)',
              border: '1px solid var(--color-border-teal)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 600,
              textTransform: 'capitalize',
            }}>
              {t(`role.${role}`)}
            </span>
          )}
        </div>
      )}

      {/* User profile capsule */}
      {currentUser && (
        <div style={{
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--color-surface-teal)',
          margin: 'var(--space-3)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-teal)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)',
              flexShrink: 0,
            }}>
              {currentUser.displayName?.[0]?.toUpperCase() || currentUser.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ overflow: 'hidden', minWidth: 0 }}>
              <p style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-semibold)',
                color: 'var(--color-text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                margin: 0,
              }}>
                {currentUser.displayName || 'My Account'}
              </p>
              <p style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-muted)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                margin: 0,
              }}>
                {currentUser.email}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation links */}
      <nav aria-label="Sidebar navigation" style={{ flex: 1, padding: 'var(--space-2) var(--space-3)' }}>
        {links.map(({ to, icon: Icon, label, labelKey }) => {
          const active = isNavActive(to);
          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: '10px var(--space-4)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 4,
                minHeight: 44,
                boxSizing: 'border-box',
                color: active ? 'var(--color-primary)' : 'var(--color-text)',
                background: active ? 'var(--color-primary-light)' : 'transparent',
                fontWeight: active ? 'var(--weight-semibold)' : 'var(--weight-regular)',
                fontSize: 'var(--text-sm)',
                textDecoration: 'none',
                transition: 'all var(--transition-fast)',
                borderLeft: active ? '3px solid var(--color-primary)' : '3px solid transparent',
              }}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t(labelKey || label)}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Logout button */}
      <div style={{ padding: 'var(--space-3) var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            width: '100%',
            padding: '10px var(--space-4)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-error)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-medium)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            minHeight: 44,
            transition: 'background var(--transition-fast)',
          }}
        >
          <LogOut size={18} />
          {t('actions.signOut')}
        </button>
      </div>
    </aside>
  );
}
