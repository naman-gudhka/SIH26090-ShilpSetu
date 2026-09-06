import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import {
  Home, Package, PlusCircle, Store, User,
  LayoutDashboard, Users, ShoppingBag, BarChart2,
  Compass
} from 'lucide-react';

const artisanNav = [
    { to: '/artisan', icon: Home, labelKey: 'nav.home', label: 'Home' },
  { to: '/artisan/products', icon: Package, labelKey: 'nav.products', label: 'Products' },
  { to: '/artisan/products/new', icon: PlusCircle, labelKey: 'nav.addProduct', label: 'Add', primary: true },
  { to: '/artisan/store', icon: Store, labelKey: 'nav.store', label: 'Store' },
  { to: '/artisan/profile', icon: User, labelKey: 'nav.profile', label: 'Profile' },
];
  
const buyerNav = [
  { to: '/buyer', icon: Home, labelKey: 'nav.home', label: 'Home' },
  { to: '/buyer/products', icon: Compass, labelKey: 'nav.explore', label: 'Explore' },
  { to: '/b2b', icon: ShoppingBag, labelKey: 'nav.b2b', label: 'B2B' },
  { to: '/buyer/profile', icon: User, labelKey: 'nav.profile', label: 'Profile' },
];

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, labelKey: 'nav.dashboard', label: 'Dashboard' },
  { to: '/admin/artisans', icon: Users, labelKey: 'nav.artisans', label: 'Artisans' },
  { to: '/admin/products', icon: Package, labelKey: 'nav.products', label: 'Products' },
  { to: '/admin/insights', icon: BarChart2, labelKey: 'nav.insights', label: 'Insights' },
];

export function BottomNav() {
  const { role } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  const navItems = role === 'artisan' ? artisanNav
    : role === 'admin' ? adminNav
    : buyerNav;

  // Don't show on auth/onboarding pages
  const noNavPaths = [
    '/login', '/signup', '/forgot-password', '/reset-password',
    '/verify-email', '/', '/select-role', '/onboarding/artisan', '/onboarding/customer'
  ];
  if (noNavPaths.includes(location.pathname)) return null;
  if (!role) return null;

  const isActive = (to) => {
    if (to === '/artisan' || to === '/buyer' || to === '/admin') {
      return location.pathname === to;
    }
    if (to === '/artisan/products/new') {
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
    if (to === '/artisan/products') {
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
    return location.pathname.startsWith(to);
  };

  return (
    <>
      <nav
        className="bottom-nav"
        role="navigation"
        aria-label="Mobile navigation"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          minHeight: 'var(--bottom-nav-height)',
          height: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          background: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'space-around',
          zIndex: 100,
          boxShadow: '0 -2px 10px rgba(28, 43, 42, 0.06)',
          userSelect: 'none',
          boxSizing: 'border-box',
        }}
      >
        {navItems.map(({ to, icon: Icon, label, labelKey, primary }) => {
          const active = isActive(to);
          return (
            <Link
              key={to}
              to={to}
              aria-label={t(labelKey || label)}
              aria-current={active ? 'page' : undefined}
              style={{
                flex: 1,
                minWidth: 0,
                minHeight: 48,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                textDecoration: 'none',
                color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                transition: 'color var(--transition-fast)',
                padding: '4px 2px',
                position: 'relative',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {active && !primary && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 28,
                    height: 3,
                    background: 'var(--color-primary)',
                    borderRadius: '0 0 3px 3px',
                  }}
                  aria-hidden="true"
                />
              )}

              {primary ? (
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    marginTop: -14,
                    boxShadow: '0 4px 12px rgba(15, 118, 110, 0.35)',
                    transition: 'transform var(--transition-fast)',
                  }}
                  aria-hidden="true"
                >
                  <Icon size={22} />
                </div>
              ) : (
                <Icon size={21} strokeWidth={active ? 2.3 : 1.75} aria-hidden="true" />
              )}

              <span
                style={{
                  fontSize: 'clamp(10px, 2.5vw, 11px)',
                  fontWeight: active ? 'var(--weight-semibold)' : 'var(--weight-medium)',
                  letterSpacing: '0.01em',
                  lineHeight: 1.15,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                  textAlign: 'center',
                }}
              >
                {t(labelKey || label)}
              </span>
            </Link>
          );
        })}
      </nav>

      <style>{`
        @media (min-width: 1024px) {
          .bottom-nav {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
