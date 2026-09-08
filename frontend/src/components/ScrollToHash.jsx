// frontend/src/components/ScrollToHash.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// This component renders nothing. Its only job is to scroll the page
// to the element matching the URL hash (e.g. /#pricing -> id="pricing")
// whenever the location changes. React Router does not do this on its own.
export default function ScrollToHash() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      // small delay so the target element has time to exist/render
      const id = location.hash.replace('#', '');
      const timer = setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 80);
      return () => clearTimeout(timer);
    }

    // no hash -> plain navigation, scroll to top like a normal page load
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname, location.hash]);

  return null;
}