/**
 * Topic system of the kit design. Every public page belongs to a topic; the topic decides
 * the illustration, and the pastel colours that rotate through the page's bands.
 *
 * Pastels are the kit's (docs/tokens.css): sage, sky, butter (sand), rose, lavender.
 * Illustration files live in public/art/<name>-768.webp and -1536.webp (see SdPic).
 */
export type Pastel = "sage" | "sky" | "butter" | "rose" | "lavender";

export const PASTELS: Record<Pastel, { bg: string; deep: string }> = {
  sage: { bg: "#DFE9DC", deep: "#C9DBC4" },
  sky: { bg: "#D6E3EF", deep: "#BFD3E5" },
  butter: { bg: "#F4E7C3", deep: "#EBD9A8" },
  rose: { bg: "#F3DDD8", deep: "#EBC8C0" },
  lavender: { bg: "#E5E0ED", deep: "#D3CBE0" },
};

/** The 12 kit illustrations. */
export type ArtName =
  | "01-hero" | "02-family-protection" | "03-health-insurance" | "04-investments-growth"
  | "05-retirement" | "06-home-mortgage" | "07-car-insurance" | "08-business-insurance"
  | "09-travel-insurance" | "10-financial-planning" | "11-claims-service" | "12-childrens-savings";

export type Topic = {
  /** main illustration of the page (hero + emotion band) */
  art: ArtName;
  /** second illustration (process / closing band) */
  art2: ArtName;
  /** optional: guide aside illustration (distinct from art and art2) */
  art3?: ArtName;
  /** optional: "how it works" band illustration (distinct from art, art2 and art3) */
  art4?: ArtName;
  /** optional: closing (contact) band illustration, distinct from the other four */
  art5?: ArtName;
  /** colour of the hero stage and the first band; the rest rotate in this order */
  palette: [Pastel, Pastel, Pastel];
};

/** Fallback used when a path has no topic yet. */
export const DEFAULT_TOPIC: Topic = { art: "01-hero", art2: "11-claims-service", palette: ["sage", "sky", "butter"] };

/** Path (no trailing slash) to topic. Rotation rule: neighbouring topics never share the first colour. */
export const TOPICS: Record<string, Topic> = {
  "/insurance/life": { art: "02-family-protection", art2: "12-childrens-savings", art3: "10-financial-planning", art4: "11-claims-service", art5: "05-retirement", palette: ["sage", "sky", "butter"] },
  "/insurance/health": { art: "03-health-insurance", art2: "11-claims-service", art3: "05-retirement", art4: "10-financial-planning", art5: "02-family-protection", palette: ["rose", "butter", "sage"] },
  "/insurance/vehicle": { art: "07-car-insurance", art2: "01-hero", art3: "10-financial-planning", art4: "11-claims-service", art5: "04-investments-growth", palette: ["sky", "sage", "butter"] },
  "/insurance/home": { art: "01-hero", art2: "06-home-mortgage", art3: "02-family-protection", art4: "04-investments-growth", art5: "10-financial-planning", palette: ["butter", "sky", "rose"] },
  "/insurance/mortgage": { art: "06-home-mortgage", art2: "02-family-protection", art3: "12-childrens-savings", art4: "04-investments-growth", art5: "11-claims-service", palette: ["sky", "lavender", "butter"] },
  "/insurance/renters": { art: "11-claims-service", art2: "06-home-mortgage", art3: "10-financial-planning", art4: "01-hero", art5: "05-retirement", palette: ["lavender", "sage", "butter"] },
  "/insurance/business": { art: "08-business-insurance", art2: "10-financial-planning", art3: "04-investments-growth", art4: "11-claims-service", art5: "01-hero", palette: ["butter", "sage", "sky"] },
  "/insurance/partners": { art: "10-financial-planning", art2: "08-business-insurance", art3: "02-family-protection", art4: "01-hero", art5: "11-claims-service", palette: ["sage", "butter", "lavender"] },
  "/insurance/travel": { art: "09-travel-insurance", art2: "01-hero", art3: "10-financial-planning", art4: "05-retirement", art5: "11-claims-service", palette: ["rose", "sky", "butter"] },
  "/insurance/nursing": { art: "05-retirement", art2: "02-family-protection", art3: "03-health-insurance", art4: "10-financial-planning", art5: "11-claims-service", palette: ["lavender", "sage", "butter"] },
  "/insurance/nursing-clalit": { art: "03-health-insurance", art2: "05-retirement", art3: "10-financial-planning", art4: "04-investments-growth", art5: "01-hero", palette: ["sage", "lavender", "butter"] },
  "/insurance/critical-illness": { art: "02-family-protection", art2: "03-health-insurance", art3: "04-investments-growth", art4: "05-retirement", art5: "10-financial-planning", palette: ["rose", "sage", "sky"] },
  "/insurance/disability": { art: "04-investments-growth", art2: "02-family-protection", art3: "11-claims-service", art4: "10-financial-planning", art5: "05-retirement", palette: ["sky", "rose", "butter"] },
  "/insurance/dental": { art: "03-health-insurance", art2: "11-claims-service", art3: "01-hero", art4: "04-investments-growth", art5: "10-financial-planning", palette: ["sky", "butter", "sage"] },
  "/insurance/accidents": { art: "11-claims-service", art2: "03-health-insurance", art3: "05-retirement", art4: "10-financial-planning", art5: "01-hero", palette: ["butter", "rose", "sky"] },
  "/insurance/foreign-workers": { art: "09-travel-insurance", art2: "03-health-insurance", art3: "02-family-protection", art4: "11-claims-service", art5: "10-financial-planning", palette: ["sage", "sky", "lavender"] },

  // savings
  "/savings/pension-funds": { art: "05-retirement", art2: "10-financial-planning", art3: "02-family-protection", art4: "04-investments-growth", art5: "11-claims-service", palette: ["sage", "butter", "sky"] },
  "/savings/pension-life-insurance": { art: "02-family-protection", art2: "05-retirement", art3: "10-financial-planning", art4: "04-investments-growth", art5: "01-hero", palette: ["lavender", "sky", "butter"] },
  "/savings/gemel-funds": { art: "04-investments-growth", art2: "12-childrens-savings", art3: "05-retirement", art4: "10-financial-planning", art5: "11-claims-service", palette: ["butter", "sage", "sky"] },
  "/savings/gemel-investment": { art: "04-investments-growth", art2: "10-financial-planning", art3: "12-childrens-savings", art4: "05-retirement", art5: "11-claims-service", palette: ["sky", "butter", "lavender"] },
  "/savings/training-funds": { art: "10-financial-planning", art2: "08-business-insurance", art3: "04-investments-growth", art4: "05-retirement", art5: "11-claims-service", palette: ["sage", "lavender", "butter"] },
  "/savings/child-savings": { art: "12-childrens-savings", art2: "02-family-protection", art3: "06-home-mortgage", art4: "10-financial-planning", art5: "01-hero", palette: ["rose", "sage", "butter"] },
  "/savings/investment": { art: "04-investments-growth", art2: "10-financial-planning", art3: "05-retirement", art4: "01-hero", art5: "11-claims-service", palette: ["sky", "sage", "rose"] },
  "/savings/employer-funds": { art: "08-business-insurance", art2: "05-retirement", art3: "02-family-protection", art4: "04-investments-growth", art5: "11-claims-service", palette: ["butter", "sky", "sage"] },
  "/savings/pre-retirement": { art: "10-financial-planning", art2: "05-retirement", art3: "06-home-mortgage", art4: "04-investments-growth", art5: "11-claims-service", palette: ["lavender", "butter", "sage"] },
  "/savings/post-retirement": { art: "05-retirement", art2: "03-health-insurance", art3: "02-family-protection", art4: "10-financial-planning", art5: "01-hero", palette: ["sage", "rose", "sky"] },
  "/savings/financial-planning": { art: "10-financial-planning", art2: "04-investments-growth", art3: "01-hero", art4: "05-retirement", art5: "11-claims-service", palette: ["lavender", "sky", "butter"] },
  // other public pages
  "/": { art: "01-hero", art2: "10-financial-planning", palette: ["sage", "sky", "butter"] },
  "/about": { art: "02-family-protection", art2: "11-claims-service", palette: ["sky", "butter", "sage"] },
  "/contact": { art: "11-claims-service", art2: "01-hero", palette: ["butter", "sage", "sky"] },
  "/faq": { art: "11-claims-service", art2: "10-financial-planning", palette: ["lavender", "sage", "butter"] },
  "/portfolio-review": { art: "11-claims-service", art2: "10-financial-planning", palette: ["sky", "butter", "sage"] },
  "/insurances": { art: "01-hero", art2: "02-family-protection", palette: ["sky", "sage", "butter"] },
  "/investment-tracks": { art: "04-investments-growth", art2: "10-financial-planning", palette: ["sky", "butter", "sage"] },
  "/savings": { art: "04-investments-growth", art2: "05-retirement", palette: ["butter", "sage", "sky"] },
  "/travel": { art: "01-hero", art2: "07-car-insurance", palette: ["sky", "rose", "butter"] },
  "/wellness": { art: "03-health-insurance", art2: "05-retirement", palette: ["sage", "rose", "sky"] },
  "/growth": { art: "04-investments-growth", art2: "10-financial-planning", palette: ["butter", "sage", "lavender"] },
  "/creativity": { art: "10-financial-planning", art2: "01-hero", palette: ["lavender", "butter", "sage"] },
};

export const topicFor = (pathname: string): Topic =>
  TOPICS[pathname.replace(/\/$/, "")] ?? DEFAULT_TOPIC;

/** A third illustration that differs from art and art2 (used by the guide aside and the story band). */
const SPARE: ArtName[] = ["10-financial-planning", "11-claims-service", "01-hero", "02-family-protection", "04-investments-growth", "05-retirement"];
export const art3Of = (t: Topic): ArtName => t.art3 ?? SPARE.find((a) => a !== t.art && a !== t.art2) ?? "01-hero";
/** A fourth illustration for the "how it works" band: never the hero, the story or the guide aside illustration. */
export const art4Of = (t: Topic): ArtName => t.art4 ?? SPARE.find((a) => a !== t.art && a !== t.art2 && a !== art3Of(t)) ?? "11-claims-service";
