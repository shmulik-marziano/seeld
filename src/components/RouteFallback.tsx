/**
 * RouteFallback — quiet Suspense loader for lazy routes.
 * Ivory canvas, a thin green progress bar and the brand symbol pulsing.
 * Respects prefers-reduced-motion. No text, no emoji.
 */
export default function RouteFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="טוען עמוד"
      className="min-h-screen bg-[#FAF7EF]"
    >
      <style>{`
        @keyframes seeld-route-bar {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        @keyframes seeld-route-pulse {
          0%, 100% { opacity: 0.35; }
          50%      { opacity: 1; }
        }
        .seeld-route-bar {
          animation: seeld-route-bar 1.1s ease-out infinite;
        }
        .seeld-route-mark {
          animation: seeld-route-pulse 1.4s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .seeld-route-bar { animation: none; transform: translateX(0); width: 100%; }
          .seeld-route-mark { animation: none; opacity: 0.8; }
        }
      `}</style>

      {/* Thin indeterminate progress bar, deep green on ivory */}
      <div className="fixed top-0 inset-x-0 h-0.5 overflow-hidden" aria-hidden="true">
        <div className="seeld-route-bar h-full w-1/4" style={{ backgroundColor: "#003D30" }} />
      </div>

      {/* The brand symbol, pulsing softly, centered */}
      <div className="flex min-h-screen items-center justify-center">
        <img
          src="/brand/logo-icon.png"
          alt=""
          width={44}
          height={64}
          className="seeld-route-mark select-none"
          style={{ height: 64, width: "auto" }}
          draggable={false}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
