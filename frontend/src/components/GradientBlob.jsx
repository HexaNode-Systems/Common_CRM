export default function GradientBlob({ position = 'right' }) {
  const side = position === 'right' ? 'right-[-10%]' : 'left-[-10%]';
  return (
    <div className={`gb-wrap pointer-events-none absolute top-1/2 ${side} h-[36rem] w-[36rem] -translate-y-1/2 overflow-visible`}>
      <div className="gb-blob absolute inset-0 rounded-full" />
      <style>{`
        .gb-blob {
          background: radial-gradient(circle at 40% 35%, rgba(255,255,255,0.9) 0%, rgba(180,160,255,0.55) 22%, rgba(129,90,230,0.35) 45%, rgba(76,29,149,0.12) 68%, transparent 75%);
          filter: blur(40px);
          animation: gb-morph 14s ease-in-out infinite;
          will-change: transform, border-radius;
        }
        @keyframes gb-morph {
          0%   { border-radius: 48% 52% 60% 40% / 55% 45% 55% 45%; transform: scale(1) translate(0, 0); }
          33%  { border-radius: 60% 40% 45% 55% / 40% 60% 40% 60%; transform: scale(1.08) translate(-20px, 15px); }
          66%  { border-radius: 42% 58% 55% 45% / 60% 40% 60% 40%; transform: scale(0.95) translate(15px, -20px); }
          100% { border-radius: 48% 52% 60% 40% / 55% 45% 55% 45%; transform: scale(1) translate(0, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .gb-blob { animation: none !important; }
        }
      `}</style>
    </div>
  );
}