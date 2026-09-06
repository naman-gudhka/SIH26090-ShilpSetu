import { useEffect, useRef, useState } from 'react';

/**
 * usePWAInstall
 * Manages the PWA beforeinstallprompt event and iOS install guidance.
 * Wraps the browser-native installation capability.
 *
 * Initial standalone/iOS detection is done via lazy useState initializers
 * so no setState is called synchronously inside an effect.
 */
export function usePWAInstall() {
  // Lazy initializers run once at mount, never inside an effect body
  const [isInstalled, setIsInstalled] = useState(() =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
  const [isIOS] = useState(() =>
    /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase())
  );
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const bannerTimerRef = useRef(null);

  useEffect(() => {
    // Show install banner after a delay (if not already installed / dismissed)
    const dismissed = localStorage.getItem('shilpsetu_install_dismissed');
    if (!isInstalled && !dismissed) {
      bannerTimerRef.current = setTimeout(() => setShowBanner(true), 3000);
    }

    const handlePrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowBanner(false);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      clearTimeout(bannerTimerRef.current);
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, [isInstalled]);

  const install = async () => {
    if (!installPrompt) return { outcome: 'no-prompt' };
    const result = await installPrompt.prompt();
    if (result.outcome === 'accepted') {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowBanner(false);
    }
    setInstallPrompt(null);
    return result;
  };

  const dismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem('shilpsetu_install_dismissed', '1');
  };

  return {
    isInstallable,
    isInstalled,
    isIOS,
    showBanner,
    install,
    dismissBanner,
  };
}
