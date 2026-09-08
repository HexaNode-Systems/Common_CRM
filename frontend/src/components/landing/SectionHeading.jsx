import { useEffect, useRef, useState } from 'react';

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
}

export default function SectionHeading({ eyebrow, title, description, align = 'left' }) {
  const [ref, visible] = useReveal();
  const isCenter = align === 'center';

  return (
    <div
      ref={ref}
      className={`max-w-2xl transition-all duration-700 ease-out motion-reduce:transition-none ${
        isCenter ? 'mx-auto text-center' : 'text-left'
      }`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
      }}
    >
      {eyebrow && (
        <div className={`flex items-center gap-2 ${isCenter ? 'justify-center' : ''}`}>
          <span className="h-1 w-6 rounded-full bg-primary" />
          <p className="text-sm font-semibold text-primary">{eyebrow}</p>
        </div>
      )}
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-relaxed text-slate-600">{description}</p>
      )}
    </div>
  );
}