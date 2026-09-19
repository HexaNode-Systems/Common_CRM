// frontend/src/components/ScrollToHash.jsx
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Manages scroll restoration and hash navigation for the landing page.
 *
 * 1. Disables browser's automatic scroll restoration on reload so that
 *    refreshing on `/` always opens at the top of the page (Hero).
 * 2. Honors explicit hash navigation (e.g. `/#faq`, `/#pricing`) on direct
 *    URL entry, external links, and navbar/in-page clicks.
 * 3. Preserves standard browser Back/Forward navigation.
 */
export default function ScrollToHash() {
  const location = useLocation();
  const isInitialMount = useRef(true);

  // Configure manual scroll restoration
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Handle location changes (pathname, hash, back/forward)
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const currentHash = location.hash;

    if (currentHash) {
      const id = currentHash.replace('#', '');
      const scrollToTarget = () => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({
            behavior: prefersReduced ? 'auto' : 'smooth',
            block: 'start',
          });
          return true;
        }
        return false;
      };

      // If element is already present, scroll to it; otherwise retry after render
      if (!scrollToTarget()) {
        const timer = setTimeout(scrollToTarget, 80);
        return () => clearTimeout(timer);
      }
    } else {
      // No hash in URL: plain navigation, initial load, or refresh on `/`
      // Always ensure the page starts at the top of the Hero.
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

      // On initial mount/refresh, ensure post-hydration layout shifts don't displace scroll
      if (isInitialMount.current) {
        requestAnimationFrame(() => {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        });
        const timer = setTimeout(() => {
          if (!window.location.hash) {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          }
        }, 50);
        return () => clearTimeout(timer);
      }
    }

    isInitialMount.current = false;
  }, [location.pathname, location.hash]);

  // Intercept anchor clicks on the page to ensure smooth, reliable scrolling
  // even when clicking the same hash multiple times
  useEffect(() => {
    const handleAnchorClick = (e) => {
      const anchor = e.target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || !href.includes('#')) return;

      const hashIndex = href.indexOf('#');
      const hash = href.slice(hashIndex);
      const targetId = hash.replace('#', '');
      const targetEl = document.getElementById(targetId);

      if (!targetEl) return;

      const currentPath = window.location.pathname;
      const targetPath = href.slice(0, hashIndex) || currentPath;

      // Only handle same-page anchor navigation
      if (targetPath === currentPath || targetPath === '/' || targetPath === '') {
        e.preventDefault();

        // Update URL hash if it changed
        if (window.location.hash !== hash) {
          window.history.pushState(null, '', hash);
        }

        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        targetEl.scrollIntoView({
          behavior: prefersReduced ? 'auto' : 'smooth',
          block: 'start',
        });
      }
    };

    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
  }, []);

  return null;
}