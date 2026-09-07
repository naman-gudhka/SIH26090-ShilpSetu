import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { TopBar } from './TopBar.jsx';
import { BottomNav } from './BottomNav.jsx';
import { Sidebar } from './Sidebar.jsx';
import { OfflineBanner } from '../pwa/OfflineBanner.jsx';
import { InstallPrompt } from '../pwa/InstallPrompt.jsx';

const AUTH_PATHS = ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/verify-email'];
const NO_SIDEBAR_PATHS = ['/select-role', '/onboarding/artisan', '/onboarding/customer'];

export function AppShell({ children }) {
  useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mainRef = useRef(null);

  const isAuthPath = AUTH_PATHS.includes(location.pathname);
  const isOnboardingPath = NO_SIDEBAR_PATHS.includes(location.pathname);
  const showShell = !isAuthPath && !isOnboardingPath;

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
  }, [location.pathname]);

  if (!showShell) {
    return (
      <>
        <OfflineBanner />
        {children}
      </>
    );
  }

  return (
    <div className="app-shell-root" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      maxHeight: '100dvh',
      background: 'var(--color-bg)',
      width: '100%',
      maxWidth: '100vw',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <OfflineBanner />
      <TopBar onMenuToggle={() => setSidebarOpen((v) => !v)} sidebarOpen={sidebarOpen} />

      <div className="app-layout-body" style={{
        display: 'flex',
        flex: 1,
        minHeight: 0,
        height: 'calc(100dvh - var(--nav-height))',
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
      }}>
        {/* Desktop Sidebar */}
        <div
          className="desktop-sidebar"
          style={{
            display: 'none',
            width: 'var(--sidebar-width)',
            minWidth: 'var(--sidebar-width)',
            maxWidth: 'var(--sidebar-width)',
            flexShrink: 0,
            height: '100%',
            overflow: 'hidden',
            background: 'var(--color-surface)',
            zIndex: 90,
          }}
        >
          <Sidebar />
        </div>

        {/* Mobile Sidebar Overlay & Drawer */}
        {sidebarOpen && (
          <>
            <div
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(28, 43, 42, 0.45)',
                zIndex: 149,
                backdropFilter: 'blur(3px)',
                WebkitBackdropFilter: 'blur(3px)',
              }}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Navigation drawer"
              style={{
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
                height: '100dvh',
                width: 'min(var(--sidebar-width), 85vw)',
                zIndex: 150,
                boxShadow: 'var(--shadow-xl)',
                animation: 'slideUp 250ms ease',
                background: 'var(--color-surface)',
                overflowY: 'auto',
              }}
            >
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>
          </>
        )}

        {/* Main Content Area */}
        <main
          ref={mainRef}
          id="main-content"
          tabIndex={-1}
          style={{
            flex: 1,
            minWidth: 0,
            height: '100%',
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px) + var(--space-4))',
            boxSizing: 'border-box',
          }}
        >
          {children}
        </main>
      </div>

      <BottomNav />
      <InstallPrompt />

      <style>{`
        @media (min-width: 1024px) {
          .desktop-sidebar {
            display: flex !important;
            flex-direction: column;
          }
          #main-content {
            padding-bottom: var(--space-8) !important;
          }
        }
        @media (max-width: 1023px) {
          #main-content {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          #main-content::-webkit-scrollbar {
            display: none;
            width: 0;
            height: 0;
          }
        }
      `}</style>
    </div>
  );
}
