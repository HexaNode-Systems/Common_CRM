import { Phone } from 'lucide-react';

// Official WhatsApp speech bubble icon
function WhatsAppIcon({ className = "w-6 h-6" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.98-.276-.1-.477-.15-.678.15-.2.3-.778.98-.954 1.18-.175.2-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.895-.798-1.5-1.784-1.675-2.085-.176-.3-.019-.463.132-.613.136-.135.301-.351.452-.527.15-.175.201-.3.301-.501.101-.2.05-.376-.025-.526-.075-.15-.678-1.634-.929-2.238-.244-.588-.493-.509-.678-.518-.175-.009-.376-.011-.577-.011-.201 0-.527.075-.803.376s-1.054 1.03-1.054 2.512 1.079 2.913 1.23 3.114c.15.2 2.124 3.243 5.145 4.547.719.31 1.28.496 1.718.635.722.23 1.379.197 1.899.12.58-.087 1.78-.727 2.03-1.43.25-.702.25-1.304.175-1.43-.075-.125-.276-.201-.577-.351zM12.04 21.785h-.002a9.78 9.78 0 0 1-4.992-1.365l-.358-.212-3.712.974.99-3.619-.233-.371a9.775 9.775 0 0 1-1.503-5.232c0-5.414 4.407-9.82 9.825-9.82a9.77 9.77 0 0 1 6.945 2.879 9.77 9.77 0 0 1 2.876 6.947c0 5.416-4.407 9.819-9.824 9.819zM12.042 0C5.397 0 .008 5.388.008 12.031a12.01 12.01 0 0 0 1.637 6.069L0 24l6.062-1.59a12.03 12.03 0 0 0 5.98 1.579h.005c6.643 0 12.033-5.388 12.033-12.031A12.03 12.03 0 0 0 12.042 0z" />
    </svg>
  );
}

export default function StickyContactButtons() {
  const phoneNumber = '+917753983175';
  const whatsappUrl = 'https://wa.me/917753983175';
  const callUrl = `tel:${phoneNumber}`;

  return (
    <aside
      aria-label="Quick Contact Options"
      className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-3 pointer-events-none pb-[env(safe-area-inset-bottom,0px)] pr-[env(safe-area-inset-right,0px)]"
    >
      <style>{`
        @keyframes wa-ring-pulse {
          0% {
            transform: scale(0.95);
            opacity: 0.7;
          }
          65% {
            transform: scale(1.45);
            opacity: 0;
          }
          100% {
            transform: scale(1.45);
            opacity: 0;
          }
        }

        @keyframes call-ring-pulse {
          0% {
            transform: scale(0.95);
            opacity: 0.7;
          }
          65% {
            transform: scale(1.45);
            opacity: 0;
          }
          100% {
            transform: scale(1.45);
            opacity: 0;
          }
        }

        @keyframes subtle-bounce-wa {
          0%, 80%, 100% {
            transform: translateY(0) scale(1);
          }
          85% {
            transform: translateY(-3px) scale(1.04);
          }
          90% {
            transform: translateY(0) scale(1);
          }
          95% {
            transform: translateY(-1.5px) scale(1.02);
          }
        }

        @keyframes subtle-wiggle-call {
          0%, 75%, 100% {
            transform: rotate(0deg);
          }
          80% {
            transform: rotate(-14deg);
          }
          85% {
            transform: rotate(14deg);
          }
          90% {
            transform: rotate(-8deg);
          }
          95% {
            transform: rotate(8deg);
          }
        }

        .sticky-btn-wa-ring {
          animation: wa-ring-pulse 3s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
        }

        .sticky-btn-call-ring {
          animation: call-ring-pulse 3s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite 1.5s;
        }

        .sticky-btn-wa-anim {
          animation: subtle-bounce-wa 4.5s ease-in-out infinite;
        }

        .sticky-btn-call-icon {
          animation: subtle-wiggle-call 4.5s ease-in-out infinite 2.25s;
        }

        @media (prefers-reduced-motion: reduce) {
          .sticky-btn-wa-ring,
          .sticky-btn-call-ring,
          .sticky-btn-wa-anim,
          .sticky-btn-call-icon {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      {/* WhatsApp Button */}
      <div className="relative flex items-center group pointer-events-auto">
        {/* Accessible tooltip label for desktop */}
        <span
          id="wa-tooltip"
          role="tooltip"
          className="hidden sm:inline-block pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-lg bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-white shadow-lg opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-focus-within:opacity-100 group-focus-within:translate-x-0 transition-all duration-200"
        >
          Chat on WhatsApp
          <span className="absolute top-1/2 -right-1 -translate-y-1/2 border-4 border-transparent border-l-slate-900/90" />
        </span>

        {/* Pulse ring */}
        <span
          aria-hidden="true"
          className="sticky-btn-wa-ring absolute inset-0 rounded-full bg-[#25D366]/40 pointer-events-none"
        />

        {/* Action Link */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with Appnix Technologies on WhatsApp"
          aria-describedby="wa-tooltip"
          className="sticky-btn-wa-anim relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-[#128C7E] to-[#25D366] text-white shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 hover:scale-105 active:scale-95 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          <WhatsAppIcon className="w-6 h-6 sm:w-7 sm:h-7 drop-shadow-sm" />
        </a>
      </div>

      {/* Call Button */}
      <div className="relative flex items-center group pointer-events-auto">
        {/* Accessible tooltip label for desktop */}
        <span
          id="call-tooltip"
          role="tooltip"
          className="hidden sm:inline-block pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-lg bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-white shadow-lg opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-focus-within:opacity-100 group-focus-within:translate-x-0 transition-all duration-200"
        >
          Call +91 77539 83175
          <span className="absolute top-1/2 -right-1 -translate-y-1/2 border-4 border-transparent border-l-slate-900/90" />
        </span>

        {/* Pulse ring */}
        <span
          aria-hidden="true"
          className="sticky-btn-call-ring absolute inset-0 rounded-full bg-indigo-500/40 pointer-events-none"
        />

        {/* Action Link */}
        <a
          href={callUrl}
          aria-label="Call Appnix Technologies"
          aria-describedby="call-tooltip"
          className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-indigo-700 via-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-600/30 hover:shadow-xl hover:shadow-indigo-600/40 hover:scale-105 active:scale-95 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          <Phone className="sticky-btn-call-icon w-5 h-5 sm:w-6 sm:h-6 drop-shadow-sm" />
        </a>
      </div>
    </aside>
  );
}
