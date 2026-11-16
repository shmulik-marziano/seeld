// Ground colours from the SEELD-BOOKS kit. Each insurance topic gets its own triple
// (hero, coverage, FAQ grounds), so pages rotate through the palette from topic to topic.
export const GROUND = {
  paper: "#FBF6EB",
  cream: "#F8EFD8",
  butter: "#F4E6BF",
  sage: "#E2E9D3",
  sky: "#D6E2EF",
  blush: "#F2DBD6",
  mist: "#E8EDED",
} as const;

type Triple = readonly [hero: string, coverage: string, faq: string];

// The three cover colours of the book kit (sage, sky, butter) in every order: each page gets one
// per big block (hero, coverage, FAQ), so the three never repeat on a page and rotate between pages.
const TRIPLES: Triple[] = [
  [GROUND.sage, GROUND.sky, GROUND.butter],
  [GROUND.sky, GROUND.butter, GROUND.sage],
  [GROUND.butter, GROUND.sage, GROUND.sky],
  [GROUND.sage, GROUND.butter, GROUND.sky],
  [GROUND.sky, GROUND.sage, GROUND.butter],
  [GROUND.butter, GROUND.sky, GROUND.sage],
];

/** Route slug (last path segment) -> triple index. Unknown slugs fall back to the first triple. */
const BY_SLUG: Record<string, number> = {
  life: 0,
  mortgage: 1,
  partners: 3,
  health: 2,
  "critical-illness": 3,
  disability: 4,
  nursing: 5,
  "nursing-clalit": 1,
  accidents: 0,
  dental: 2,
  vehicle: 4,
  home: 5,
  renters: 1,
  business: 3,
  travel: 0,
  "foreign-workers": 2,
};

export function themeFor(pathname: string): { "--gh": string; "--ga": string; "--gb": string } {
  const slug = pathname.replace(/\/$/, "").split("/").pop() ?? "";
  const [h, a, b] = TRIPLES[BY_SLUG[slug] ?? 0];
  return { "--gh": h, "--ga": a, "--gb": b };
}
