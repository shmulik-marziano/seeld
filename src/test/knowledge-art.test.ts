import { describe, it, expect } from "vitest";
import { GUIDE_CATALOG, TAX_CATALOG } from "@/data/knowledge/catalog";
import { ART_BY_SLUG, PAPER_BY_CATEGORY, artForArticle, artForSlug } from "@/data/knowledge/art";
import { CATEGORIES } from "@/data/knowledge/categories";
import { SPOTS } from "@/components/sd/spots";
import { articles } from "@/data/articles";
import { groupTerms, letterOf } from "@/components/sd/knowledge";
import { GLOSSARY_TERMS } from "@/data/glossary";

// Design pass 23.11.2026: every knowledge page has its own pencil drawing, and no two pages of a category
// share one. The glossary groups by the Hebrew alphabet.

const ALL = [...GUIDE_CATALOG, ...TAX_CATALOG];

describe("knowledge art", () => {
  it("maps every catalog entry, and nothing else", () => {
    const slugs = ALL.map((e) => e.slug).sort();
    expect(Object.keys(ART_BY_SLUG).sort()).toEqual(slugs);
  });

  it("uses real kit spots and icons", () => {
    for (const [slug, a] of Object.entries(ART_BY_SLUG)) {
      expect(a.spot in SPOTS, `${slug}: spot ${a.spot}`).toBe(true);
    }
  });

  it("never repeats a spot within a category, and the icon pair is unique too", () => {
    for (const c of CATEGORIES) {
      const entries = ALL.filter((e) => e.category === c.key);
      const spots = entries.map((e) => artForSlug(e.slug).spot);
      expect(new Set(spots).size, `${c.key}: ${spots.join(", ")}`).toBe(spots.length);
      const pairs = entries.map((e) => `${artForSlug(e.slug).spot}+${artForSlug(e.slug).icon}`);
      expect(new Set(pairs).size).toBe(pairs.length);
      expect(PAPER_BY_CATEGORY[c.key]).toBeTruthy();
    }
  });

  it("gives the legacy articles a drawing that is unique within their category and stable", () => {
    const byCat = new Map<string, string[]>();
    for (const a of articles) byCat.set(a.category, [...(byCat.get(a.category) ?? []), a.id]);
    for (const [cat, ids] of byCat) {
      const spots = ids.map((id) => artForArticle(id, cat, ids).spot);
      expect(new Set(spots).size, cat).toBe(spots.length);
      expect(artForArticle(ids[0], cat, ids)).toEqual(artForArticle(ids[0], cat, [...ids].reverse()));
    }
  });
});

describe("glossary grouping", () => {
  it("folds final letters and groups in alphabet order", () => {
    expect(letterOf("ניוד")).toBe("נ");
    expect(letterOf("\"קיבוע זכויות\"")).toBe("ק");
    const groups = groupTerms(GLOSSARY_TERMS);
    const letters = groups.map((g) => g.letter);
    const order = [..."אבגדהוזחטיכלמנסעפצקרשת"];
    expect([...letters].sort((a, b) => order.indexOf(a) - order.indexOf(b))).toEqual(letters);
    expect(groups.reduce((n, g) => n + g.terms.length, 0)).toBe(GLOSSARY_TERMS.length);
  });
});
