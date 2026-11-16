// Chapter-ground colours from the SEELD-BOOKS kit. Each insurance topic gets its own pair
// (coverage ground, FAQ ground), so pages rotate through the palette from topic to topic.
export const GROUND = {
  paper: "#FBF6EB",
  cream: "#F8EFD8",
  butter: "#F4E6BF",
  sage: "#E2E9D3",
  sky: "#D6E2EF",
  blush: "#F2DBD6",
  mist: "#E8EDED",
} as const;

type Pair = readonly [a: string, b: string];

const PAIRS: Pair[] = [
  [GROUND.sage, GROUND.sky],
  [GROUND.sky, GROUND.blush],
  [GROUND.butter, GROUND.sage],
  [GROUND.blush, GROUND.butter],
  [GROUND.mist, GROUND.sky],
  [GROUND.cream, GROUND.sage],
];

/** Route slug (last path segment) -> pair index. Unknown slugs fall back to the first pair. */
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

export function themeFor(pathname: string): { "--ga": string; "--gb": string } {
  const slug = pathname.replace(/\/$/, "").split("/").pop() ?? "";
  const [a, b] = PAIRS[BY_SLUG[slug] ?? 0];
  return { "--ga": a, "--gb": b };
}
