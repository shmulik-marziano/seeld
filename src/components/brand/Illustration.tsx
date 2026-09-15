import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * The six brand illustrations (kit v1.1). Source 1536×1024 (3:2), opaque ivory
 * background. Rendered with `object-fit: contain` and never cropped or flipped.
 *
 * Files live in /public/brand/illustrations as WebP in three widths; the
 * manifest (/public/brand/manifest.json) mirrors this map.
 */
export type IllustrationName =
  | "01-journey"
  | "02-family-protection"
  | "03-saving-growth"
  | "04-retirement-horizon"
  | "05-clarity-decisions"
  | "06-documents-service";

const WIDTHS = [480, 960, 1536] as const;

/** Short Hebrew descriptions — used only when the illustration is content in itself. */
export const ILLUSTRATION_ALT: Record<IllustrationName, string> = {
  "01-journey": "שביל בהיר מתפתל בין גבעות ירוקות אל אופק עם שמש",
  "02-family-protection": "משפחה עומדת על שביל תחת קשת של שני עלים",
  "03-saving-growth": "אבנים מאוזנות זו על זו ונבט צומח מעליהן, על רקע נוף",
  "04-retirement-horizon": "ספסל תחת עץ זית מול נוף פתוח ושביל",
  "05-clarity-decisions": "מסמך וזכוכית מגדלת לצד עלה",
  "06-documents-service": "תיקיית מסמכים ירוקה עם בועת שיחה",
};

export const ILLUSTRATION_SRC = (name: IllustrationName, width: (typeof WIDTHS)[number]) =>
  `/brand/illustrations/${name}-${width}.webp`;

interface IllustrationProps {
  name: IllustrationName;
  /** Default "" = decorative (the heading explains it). Pass true to use the catalogue description. */
  describe?: boolean;
  alt?: string;
  /** `sizes` for the browser's width selection. Default: full width on phones, 560px on desktop. */
  sizes?: string;
  /** Above-the-fold hero art: eager + high priority. Everything else lazy. */
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Illustration({
  name,
  describe = false,
  alt,
  sizes = "(min-width: 1024px) 560px, (min-width: 640px) 80vw, 100vw",
  priority = false,
  className,
  style,
}: IllustrationProps) {
  const srcSet = WIDTHS.map((w) => `${ILLUSTRATION_SRC(name, w)} ${w}w`).join(", ");
  const altText = alt ?? (describe ? ILLUSTRATION_ALT[name] : "");
  return (
    <img
      src={ILLUSTRATION_SRC(name, 960)}
      srcSet={srcSet}
      sizes={sizes}
      width={1536}
      height={1024}
      alt={altText}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : "auto"}
      draggable={false}
      className={cn("brand-illustration select-none", className)}
      style={style}
    />
  );
}

export default Illustration;
