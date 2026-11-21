import { useEffect } from "react";
import { clearSnapshot, getSnapshot } from "@/lib/prerenderSnapshot";
import { LOGO_DOTS_TRANSITION, markPhaseMs } from "@/lib/flags/logoDots";
import LogoDots from "@/components/brand/LogoDots";
import LogoMark from "@/components/brand/LogoMarkLazy";
import { LIVE_MARK } from "@/lib/flags/liveMark";

/**
 * RouteFallback: quiet Suspense loader for lazy routes.
 * Switch on (src/lib/flags/logoDots.ts, default): the live mark (thinking) on the cream canvas, or the five
 * logo dots with VITE_LIVE_MARK=off, same as RouteTransitionDots, no progress bar. Switch off (VITE_LOGO_DOTS=off): the previous loader, unchanged:
 * cream canvas, a thin ink progress bar and the brand symbol pulsing.
 * Respects prefers-reduced-motion. No text, no emoji.
 */
export default function RouteFallback() {
  // First load of a prerendered route: keep showing the snapshot until the real page is ready.
  const snap = getSnapshot();
  useEffect(() => () => clearSnapshot(), []);
  if (snap) return <div dangerouslySetInnerHTML={{ __html: snap }} />;
  if (LOGO_DOTS_TRANSITION) {
    return (
      <div role="status" aria-live="polite" aria-label="העמוד נטען" className="seeld-dots-stage min-h-screen bg-[#FCF8EF]">
        {LIVE_MARK ? (
          <div className="seeld-dots-mark">
            <LogoMark state="thinking" instant phaseMs={markPhaseMs} size="clamp(120px, 26vw, 176px)" />
          </div>
        ) : (
          <LogoDots />
        )}
      </div>
    );
  }
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="טוען עמוד"
      className="min-h-screen bg-[#FCF8EF]"
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
        .seeld-route-bar { animation: seeld-route-bar 1.1s ease-out infinite; }
        .seeld-route-mark { animation: seeld-route-pulse 1.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .seeld-route-bar { animation: none; transform: translateX(0); width: 100%; }
          .seeld-route-mark { animation: none; opacity: 0.8; }
        }
      `}</style>

      <div className="fixed top-0 inset-x-0 h-0.5 overflow-hidden" aria-hidden="true">
        <div className="seeld-route-bar h-full w-1/4" style={{ backgroundColor: "#203957" }} />
      </div>

      <div className="flex min-h-screen items-center justify-center">
        <img
          src="/brand/logo-icon-96.png"
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
