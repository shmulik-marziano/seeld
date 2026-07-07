// Hand-drawn line figures — the bento panels' illustrated cast,
// in the spirit of insurance & finance. Ink line-work, no fills,
// meant to sit on the orange / paper tiles.

const stroke = { stroke: "#171717", strokeWidth: 2.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };

/** Umbrella in light rain — protection */
export const UmbrellaFigure = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 120 110" className={className} aria-hidden="true">
    <path d="M18 52 C22 26 46 14 60 14 C74 14 98 26 102 52 C88 44 76 44 60 52 C44 44 32 44 18 52 Z" {...stroke} />
    <path d="M60 14 L60 8" {...stroke} />
    <path d="M60 52 L60 88 C60 96 52 98 47 93" {...stroke} />
    <path d="M28 70 L25 79 M44 76 L41 85 M78 72 L75 81 M94 66 L91 75" {...stroke} strokeWidth={2.1} />
  </svg>
);

/** Coin sprout — savings that grow */
export const SproutFigure = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 120 110" className={className} aria-hidden="true">
    <path d="M60 96 L60 52" {...stroke} />
    <path d="M60 66 C48 66 38 58 36 44 C50 44 58 52 60 62" {...stroke} />
    <path d="M60 56 C72 56 82 48 84 34 C70 34 62 42 60 52" {...stroke} />
    <circle cx="60" cy="30" r="14" {...stroke} />
    <path d="M60 23 L60 37 M55 26.5 C55 24.5 65 24.5 65 28 C65 31.5 55 31 55 34 C55 37 65 37 65 34.5" {...stroke} strokeWidth={2} />
    <path d="M38 96 L82 96" {...stroke} />
  </svg>
);

/** Shield with a check — coverage that holds */
export const ShieldFigure = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 120 110" className={className} aria-hidden="true">
    <path d="M60 12 L92 24 C92 56 84 82 60 96 C36 82 28 56 28 24 Z" {...stroke} />
    <path d="M46 54 L57 65 L76 42" {...stroke} />
  </svg>
);

/** Family under one line-roof — the household */
export const FamilyFigure = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 120 110" className={className} aria-hidden="true">
    <path d="M20 46 L60 16 L100 46" {...stroke} />
    <circle cx="44" cy="62" r="9" {...stroke} />
    <path d="M31 96 C31 84 37 78 44 78 C51 78 57 84 57 96" {...stroke} />
    <circle cx="76" cy="66" r="7" {...stroke} />
    <path d="M65 96 C65 86 70 80 76 80 C82 80 87 86 87 96" {...stroke} />
  </svg>
);
