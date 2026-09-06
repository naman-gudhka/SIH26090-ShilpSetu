import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNetwork } from '../../context/NetworkContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { LanguageSelector } from '../shared/LanguageSelector.jsx';
import { ConnectionIndicator } from '../pwa/ConnectionIndicator.jsx';
import { authService } from '../../services/authService.js';
import {
  LogOut, User, Menu, X, ChevronDown, LayoutDashboard
} from 'lucide-react';
import { useState } from 'react';

export function TopBar({ onMenuToggle, sidebarOpen }) {
  const { currentUser, role, logout, availableRoles } = useAuth();
  const { t } = useLanguage();
  useNetwork();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    if (logout) await logout();
    else if (authService?.signOut) await authService.signOut();
    navigate('/login');
  };

  const roleLabel = role ? t(`role.${role}`) : '';

  // Don't show topbar on auth pages
  const authPaths = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email', '/'];
  if (authPaths.includes(location.pathname)) return null;

  return (
    <header className="topbar-root" style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      height: 'var(--nav-height)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 var(--page-padding)',
      boxShadow: '0 1px 4px rgba(28,43,42,0.06)',
      boxSizing: 'border-box',
      flexShrink: 0,
      width: '100%',
    }}>
      {/* Left: Hamburger (mobile/tablet) + Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1, minWidth: 0 }}>
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            style={{
              display: 'none',
              padding: 'var(--space-2)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text)',
              cursor: 'pointer',
              minWidth: 40,
              minHeight: 40,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="mobile-menu-btn"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        )}

        <Link to={role === 'artisan' ? '/artisan' : role === 'admin' ? '/admin' : '/buyer'}
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', textDecoration: 'none', minWidth: 0, flexShrink: 0 }}
        >
          <img src="/icons/icon-192.png" alt="ShilpSetu" width={30} height={30}
            style={{ borderRadius: 8, flexShrink: 0 }} />
          <span className="topbar-brand-name" style={{
            fontWeight: 'var(--weight-bold)',
            fontSize: 'var(--text-lg)',
            color: 'var(--color-primary)',
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
          }}>
            ShilpSetu
          </span>
        </Link>

        {roleLabel && (
          <span className="topbar-role-badge" style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            background: 'var(--color-border-light)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
            fontWeight: 'var(--weight-medium)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            {roleLabel}
          </span>
        )}
      </div>

      {/* Right: Connection + Language + Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
        <div className="topbar-conn-wrapper">
          <ConnectionIndicator />
        </div>
        <div className="topbar-lang-wrapper">
          <LanguageSelector compact />
        </div>

        {currentUser && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              aria-label="Profile menu"
              aria-expanded={profileOpen}
              className="topbar-profile-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: '4px var(--space-2)',
                borderRadius: 'var(--radius-md)',
                background: profileOpen ? 'var(--color-border-light)' : 'transparent',
                cursor: 'pointer',
                color: 'var(--color-text)',
                minHeight: 40,
                border: 'none',
              }}
            >
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-bold)',
                flexShrink: 0,
              }}>
                {currentUser.displayName?.[0]?.toUpperCase() || currentUser.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="topbar-user-name" style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-medium)',
                maxWidth: 110,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {currentUser.displayName || currentUser.email?.split('@')[0]}
              </span>
              <ChevronDown className="topbar-profile-chevron" size={14} style={{ opacity: 0.5, flexShrink: 0 }} />
            </button>

            {profileOpen && (
              <>
                <div
                  onClick={() => setProfileOpen(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 190 }}
                  aria-hidden="true"
                />
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: 'var(--space-2)',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  minWidth: 190,
                  zIndex: 200,
                  overflow: 'hidden',
                }}>
                  <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border-light)' }}>
                    <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', margin: 0 }}>
                      {currentUser.displayName || 'My Account'}
                    </p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {currentUser.email}
                    </p>
                  </div>
                  {availableRoles?.length > 1 && (
                    <Link to="/choose-panel" onClick={() => setProfileOpen(false)} style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                      padding: 'var(--space-3) var(--space-4)',
                      color: 'var(--color-primary)',
                      textDecoration: 'none',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--weight-semibold)',
                      borderBottom: '1px solid var(--color-border-light)',
                    }}>
                      <LayoutDashboard size={16} /> {t('panel.chooseWorkspace')}
                    </Link>
                  )}

                  {role === 'artisan' && (
                    <Link to="/artisan/profile" onClick={() => setProfileOpen(false)} style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                      padding: 'var(--space-3) var(--space-4)',
                      color: 'var(--color-text)',
                      textDecoration: 'none',
                      fontSize: 'var(--text-sm)',
                    }}>
                      <User size={16} /> {t('nav.profile')}
                    </Link>
                  )}

                  {role === 'buyer' && (
                    <Link to="/buyer/profile" onClick={() => setProfileOpen(false)} style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                      padding: 'var(--space-3) var(--space-4)',
                      color: 'var(--color-text)',
                      textDecoration: 'none',
                      fontSize: 'var(--text-sm)',
                    }}>
                      <User size={16} /> {t('buyer.myAccount')}
                    </Link>
                  )}

                  <button onClick={handleLogout} style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-2)', width: '100%',
                    padding: 'var(--space-3) var(--space-4)',
                    color: 'var(--color-error)',
                    fontSize: 'var(--text-sm)',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    borderTop: '1px solid var(--color-border-light)',
                  }}>
                    <LogOut size={16} /> {t('actions.signOut')}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .mobile-menu-btn { display: flex !important; }
        }
        @media (max-width: 640px) {
          .topbar-user-name { display: none !important; }
          .topbar-conn-wrapper { display: none !important; }
        }
        @media (max-width: 480px) {
          .topbar-root {
            padding: 0 var(--space-2) !important;
          }
          .topbar-role-badge { display: none !important; }
          .topbar-profile-chevron { display: none !important; }
          .topbar-profile-btn {
            padding: 2px !important;
          }
          .topbar-lang-wrapper button {
            min-width: 32px !important;
            padding: 2px 6px !important;
            font-size: 11px !important;
          }
        }
        @media (max-width: 360px) {
          .topbar-brand-name {
            font-size: var(--text-base) !important;
          }
        }
      `}</style>
    </header>
  );
}
