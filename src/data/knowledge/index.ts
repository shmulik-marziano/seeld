// Knowledge section: lazy loaders and catalog helpers. Guide bodies live in ./guides/<slug>.ts and
// ./tax/<slug>.ts (one module each, export "guide") and are loaded on demand, so they never enter
// the main bundle. A module that does not exist (yet) resolves to null: the page renders NotFound.
import type { Guide, GuideCategoryKey, GuideSource } from "./types";
import { GUIDE_CATALOG, GUIDES_BASE, TAX_BASE, TAX_CATALOG, type CatalogEntry } from "./catalog";
import { CATEGORIES, CATEGORY_BY_KEY, GUIDE_CATEGORIES, categoryFor } from "./categories";

export { CATEGORIES, CATEGORY_BY_KEY, GUIDE_CATEGORIES, categoryFor };
export { GUIDE_CATALOG, TAX_CATALOG, GUIDES_BASE, TAX_BASE };
export type { CatalogEntry };

export type KnowledgeSection = "guides" | "tax";

/** One row of the tax figures table (module ./tax/numbers.ts, export TAX_FIGURES). */
export interface TaxFigureRow {
  label: string;
  value: string;
  unit?: string;
  basis?: string;
}

export interface KnowledgeModule {
  guide: Guide;
  TAX_FIGURES?: TaxFigureRow[];
  TAX_SOURCES?: GuideSource[];
}

type Loader = () => Promise<Record<string, unknown>>;

const guideModules = import.meta.glob("./guides/*.ts") as Record<string, Loader>;
const taxModules = import.meta.glob("./tax/*.ts") as Record<string, Loader>;

const isGuide = (v: unknown): v is Guide =>
  !!v && typeof v === "object" && typeof (v as Guide).slug === "string" && Array.isArray((v as Guide).blocks);

const LISTS: Record<KnowledgeSection, { base: string; catalog: CatalogEntry[]; modules: Record<string, Loader>; dir: string }> = {
  guides: { base: GUIDES_BASE, catalog: GUIDE_CATALOG, modules: guideModules, dir: "./guides" },
  tax: { base: TAX_BASE, catalog: TAX_CATALOG, modules: taxModules, dir: "./tax" },
};

export interface CatalogHit {
  entry: CatalogEntry;
  section: KnowledgeSection;
}

/** Catalog entry of a public path such as "/learn/guides/<slug>" or "/learn/pension-tax/<slug>"; undefined otherwise. */
export function catalogFor(path: string): CatalogHit | undefined {
  const p = path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
  for (const section of ["guides", "tax"] as const) {
    const { base, catalog } = LISTS[section];
    if (!p.startsWith(`${base}/`)) continue;
    const slug = p.slice(base.length + 1);
    const entry = catalog.find((e) => e.slug === slug);
    return entry ? { entry, section } : undefined;
  }
  return undefined;
}

/** Catalog entry by slug (guides first, then the tax series). */
export function catalogBySlug(slug: string, section?: KnowledgeSection): CatalogHit | undefined {
  const sections: KnowledgeSection[] = section ? [section] : ["guides", "tax"];
  for (const s of sections) {
    const entry = LISTS[s].catalog.find((e) => e.slug === slug);
    if (entry) return { entry, section: s };
  }
  return undefined;
}

export const pathOf = (section: KnowledgeSection, slug: string): string => `${LISTS[section].base}/${slug}`;

/** Loads a whole knowledge module. Null when the slug is unknown, the module is missing or malformed. */
export async function loadKnowledgeModule(slug: string, section?: KnowledgeSection): Promise<KnowledgeModule | null> {
  const hit = catalogBySlug(slug, section);
  if (!hit) return null;
  const { modules, dir } = LISTS[hit.section];
  const loader = modules[`${dir}/${slug}.ts`];
  if (!loader) return null;
  try {
    const mod = await loader();
    return isGuide(mod.guide) ? (mod as unknown as KnowledgeModule) : null;
  } catch {
    return null;
  }
}

/** Loads the "guide" export of a module; null when it does not exist. */
export async function loadGuide(slug: string, section?: KnowledgeSection): Promise<Guide | null> {
  return (await loadKnowledgeModule(slug, section))?.guide ?? null;
}

/** Catalog entries of one category (guides and tax series together). */
export const entriesByCategory = (key: GuideCategoryKey): CatalogEntry[] =>
  [...GUIDE_CATALOG, ...TAX_CATALOG].filter((e) => e.category === key);
