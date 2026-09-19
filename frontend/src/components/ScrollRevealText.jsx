import { useEffect, useRef, useState } from 'react';

// Splits text into words, and colors each word based on how far
// the block has scrolled through the viewport — exactly like Orchid's testimonial.
export default function ScrollRevealText({ text, highlightWords = [], className = '' }) {
  const ref = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function handleScroll() {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // progress goes 0 -> 1 as the block travels from bottom of viewport to ~40% up
      const start = vh * 0.9;
      const end = vh * 0.35;
      const p = (start - rect.top) / (start - end);
      setProgress(Math.min(Math.max(p, 0), 1));
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const words = text.split(' ');

  return (
    <p ref={ref} className={className}>
      {words.map((word, i) => {
        const wordThreshold = i / words.length;
        const isRevealed = progress >= wordThreshold;
        const isHighlight = highlightWords.some((h) => word.toLowerCase().includes(h.toLowerCase()));
        return (
          <span
            key={i}
            className="transition-colors duration-300"
            style={{
              color: isRevealed
                ? (isHighlight ? '#a3e635' : '#ffffff')
                : 'rgba(148, 163, 184, 0.4)',
            }}
          >
            {word}{' '}
          </span>
        );
      })}
    </p>
  );
}