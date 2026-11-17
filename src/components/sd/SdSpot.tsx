import type { CSSProperties } from "react";
import { SPOTS, type SpotName } from "./spots";

interface SdSpotProps {
  name: SpotName;
  /** Rendered width in px; height follows the asset's aspect ratio. Defaults to the asset's natural width. */
  size?: number;
  className?: string;
  style?: CSSProperties;
}

/** Decorative spot illustration (single element, transparent background). */
export function SdSpot({ name, size, className, style }: SdSpotProps) {
  const spot = SPOTS[name];
  const width = size ?? spot.w;
  const height = Math.round((width * spot.h) / spot.w);
  return (
    <img
      src={`/art/spot/${name}.webp`}
      alt=""
      aria-hidden="true"
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      className={className}
      style={style}
    />
  );
}

export default SdSpot;
