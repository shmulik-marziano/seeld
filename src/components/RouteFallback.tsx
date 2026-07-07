/**
 * RouteFallback — quiet Suspense loader for lazy routes.
 * STYLESEED: white canvas, ink (#171717), Geist Mono wordmark, Snap motion,
 * respects prefers-reduced-motion. Greyscale only, no emoji.
 */
export default function RouteFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="טוען עמוד"
      className="min-h-screen bg-white"
    >
      <style>{`
        @keyframes seeld-route-bar {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        @keyframes seeld-route-pulse {
          0%, 100% { opacity: 0.25; }
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
          .seeld-route-mark { animation: none; opacity: 0.6; }
        }
      `}</style>

      {/* Thin indeterminate progress bar, ink on white */}
      <div className="fixed top-0 inset-x-0 h-0.5 overflow-hidden" aria-hidden="true">
        <div
          className="seeld-route-bar h-full w-1/4"
          style={{ backgroundColor: "#ffffff" }}
        />
      </div>

      {/* Small mono wordmark pulse, centered */}
      <div className="flex min-h-screen items-center justify-center">
        <span
          className="seeld-route-mark select-none text-xs tracking-[0.3em]"
          style={{
            fontFamily: "'Geist Mono', ui-monospace, monospace",
            color: "#171717",
          }}
          aria-hidden="true"
        >
          SEELD
        </span>
      </div>
    </div>
  );
}
