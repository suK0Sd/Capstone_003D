import { useEffect } from 'react';
import { useLocation } from 'react-router';

/**
 * Automatically scrolls window to top on route change in SPA.
 * If a hash anchor is present (#section), scrolls to that element.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });
  }, [pathname, hash]);

  return null;
}
