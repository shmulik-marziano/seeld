import { lazy, Suspense, type CSSProperties } from "react";
import type { LogoMarkProps } from "@/components/brand/LogoMark";

// The live mark carries about 7.5 KB of path data and its own stylesheet. Surfaces that live in the main entry chunk
// (launcher, nudge, route loader, home stage) load it through this wrapper so the path data stays out of that chunk.
// Until it arrives, a same-sized, empty, inert box holds the space (no layout shift).
const LogoMark = lazy(() => import("@/components/brand/LogoMark"));

export default function LogoMarkLazy(props: LogoMarkProps) {
  const size = props.size ?? "48px";
  const box: CSSProperties = { display: "inline-block", width: size, height: size, flex: "none" };
  return (
    <Suspense fallback={<span aria-hidden="true" data-logo-placeholder="" style={box} />}>
      <LogoMark {...props} />
    </Suspense>
  );
}
