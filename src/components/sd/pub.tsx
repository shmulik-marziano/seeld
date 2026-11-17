import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { SdBand, SdCrumbs, SdPic, SdProgress, SdStageSpot, tintStyle } from "./primitives";
import { PASTELS, type ArtName, type Pastel, type Topic } from "./topics";
import "./sd.css";
import "./pub.css";

/** Topics of the "pub2" pages (topics.ts is shared, so the pages that are not there live here). */
export const PUB_TOPICS = {
  learn: { art: "10-financial-planning", art2: "04-investments-growth", palette: ["sky", "butter", "sage"] },
  blog: { art: "01-hero", art2: "10-financial-planning", palette: ["rose", "sage", "sky"] },
  wellness: { art: "03-health-insurance", art2: "05-retirement", palette: ["sage", "rose", "sky"] },
  growth: { art: "04-investments-growth", art2: "10-financial-planning", palette: ["butter", "sage", "lavender"] },
  creativity: { art: "01-hero", art2: "10-financial-planning", palette: ["lavender", "butter", "sage"] },
  calculators: { art: "04-investments-growth", art2: "10-financial-planning", palette: ["sky", "lavender", "butter"] },
  fundFinder: { art: "04-investments-growth", art2: "10-financial-planning", palette: ["sage", "butter", "sky"] },
  returnTables: { art: "04-investments-growth", art2: "05-retirement", palette: ["butter", "sky", "sage"] },
  rights: { art: "11-claims-service", art2: "02-family-protection", palette: ["rose", "sage", "butter"] },
  directDebit: { art: "04-investments-growth", art2: "01-hero", palette: ["sky", "butter", "sage"] },
  onboarding: { art: "01-hero", art2: "11-claims-service", palette: ["sage", "sky", "butter"] },
} satisfies Record<string, Topic>;

const TONES: Pastel[] = ["sage", "sky", "butter", "rose", "lavender"];
export const toneAt = (i: number): Pastel => TONES[((i % TONES.length) + TONES.length) % TONES.length];

/** Illustration (and colour) that fits an article by its category and title. */
export function artForText(category: string | null | undefined, title = ""): { art: ArtName; tone: Pastel } {
  const t = `${category ?? ""} ${title}`;
  if (/ילד|ילדים/.test(t)) return { art: "12-childrens-savings", tone: "rose" };
  if (/פרישה|פנסיה|קצבה|גמלאות/.test(t)) return { art: "05-retirement", tone: "lavender" };
  if (/משכנתא|דירה/.test(t)) return { art: "06-home-mortgage", tone: "sky" };
  if (/רכב/.test(t)) return { art: "07-car-insurance", tone: "sky" };
  if (/עסק/.test(t)) return { art: "08-business-insurance", tone: "butter" };
  if (/נסיעות|חו.?ל/.test(t)) return { art: "09-travel-insurance", tone: "rose" };
  if (/בריאות|סיעוד|כושר|מחלה/.test(t)) return { art: "03-health-insurance", tone: "rose" };
  if (/חיים|משפחה|שאירים/.test(t)) return { art: "02-family-protection", tone: "sage" };
  if (/חיסכון|השקע|גמל|השתלמות|ריבית|מדד/.test(t)) return { art: "04-investments-growth", tone: "butter" };
  if (/תקציב|תכנון|פיננס/.test(t)) return { art: "10-financial-planning", tone: "lavender" };
  if (/מסמכ|טפסים|שירות|זכויות|תביע|תלוש/.test(t)) return { art: "11-claims-service", tone: "sage" };
  if (/ביטוח|פוליס|כיסוי|טעויות/.test(t)) return { art: "01-hero", tone: "sky" };
  return { art: "10-financial-planning", tone: "sky" };
}

/** A second, different illustration for the same topic (side cards that sit next to the hero art). */
export const companionArt = (art: ArtName): ArtName => ART_RELATED[art][0];

/** Static article dates carry abbreviated months ("12 באפר׳ 2025"); blog dates are full ("17 במרץ 2026"). Same display for both. */
const MONTHS_FULL: Record<string, string> = { "בינו׳": "בינואר", "בפבר׳": "בפברואר", "באפר׳": "באפריל", "ביוני׳": "ביוני", "ביולי׳": "ביולי", "באוג׳": "באוגוסט", "בספט׳": "בספטמבר", "באוק׳": "באוקטובר", "בנוב׳": "בנובמבר", "בדצמ׳": "בדצמבר" };
export const fullMonthDate = (d: string) => d.replace(/\S+׳/, (m) => MONTHS_FULL[m] ?? m);

const ART_TONE: Record<ArtName, Pastel> = {
  "01-hero": "sky", "02-family-protection": "sage", "03-health-insurance": "rose", "04-investments-growth": "butter",
  "05-retirement": "lavender", "06-home-mortgage": "sky", "07-car-insurance": "sky", "08-business-insurance": "butter",
  "09-travel-insurance": "rose", "10-financial-planning": "lavender", "11-claims-service": "sage", "12-childrens-savings": "rose",
};
const ART_POOL: ArtName[] = [
  "04-investments-growth", "10-financial-planning", "05-retirement", "02-family-protection", "03-health-insurance", "11-claims-service",
  "12-childrens-savings", "06-home-mortgage", "08-business-insurance", "01-hero", "07-car-insurance", "09-travel-insurance",
];

/** Topically related illustrations, tried in order when the exact one is taken by a neighbouring card. */
const ART_RELATED: Record<ArtName, ArtName[]> = {
  "01-hero": ["11-claims-service", "06-home-mortgage", "10-financial-planning"],
  "02-family-protection": ["12-childrens-savings", "03-health-insurance", "05-retirement"],
  "03-health-insurance": ["02-family-protection", "05-retirement", "11-claims-service"],
  "04-investments-growth": ["10-financial-planning", "05-retirement", "12-childrens-savings"],
  "05-retirement": ["04-investments-growth", "02-family-protection", "10-financial-planning"],
  "06-home-mortgage": ["01-hero", "12-childrens-savings", "02-family-protection"],
  "07-car-insurance": ["01-hero", "11-claims-service", "04-investments-growth"],
  "08-business-insurance": ["10-financial-planning", "04-investments-growth", "11-claims-service"],
  "09-travel-insurance": ["01-hero", "07-car-insurance", "11-claims-service"],
  "10-financial-planning": ["04-investments-growth", "11-claims-service", "01-hero"],
  "11-claims-service": ["10-financial-planning", "01-hero", "08-business-insurance"],
  "12-childrens-savings": ["04-investments-growth", "02-family-protection", "06-home-mortgage"],
};

/**
 * Illustrations for a run of article cards: keeps each card's topical art, but no art repeats within the previous
 * three cards (covers the row and the card directly above in a 3-column grid), none matches the bands around the
 * grid (`before` / `after`), and the whole run draws on many illustrations (least-used related art wins).
 */
export function spreadArts(items: { category?: string | null; title?: string }[], before: ArtName[] = [], after: ArtName[] = []): { art: ArtName; tone: Pastel }[] {
  const out: { art: ArtName; tone: Pastel }[] = [];
  const used = new Map<ArtName, number>();
  items.forEach((it, i) => {
    const pref = artForText(it.category, it.title ?? "");
    const recent = [...(i < 2 ? before : before.slice(-1)), ...out.slice(-3).map((o) => o.art)];
    const last = i === items.length - 1;
    const bad = (a: ArtName) => recent.includes(a) || (last && after.includes(a));
    const order = [...new Set<ArtName>([pref.art, ...ART_RELATED[pref.art], ...ART_POOL])].filter((a) => !bad(a));
    const pool = order.length ? order.slice(0, 3) : [ART_POOL[i % ART_POOL.length]];
    const art = pool.reduce((best, a) => ((used.get(a) ?? 0) < (used.get(best) ?? 0) ? a : best), pool[0]);
    used.set(art, (used.get(art) ?? 0) + 1);
    out.push(art === pref.art ? pref : { art, tone: ART_TONE[art] });
  });
  return out;
}

const arrow = <BrandIcon name="arrow-left" size={18} />;

/** Hero of a public page: crumbs, eyebrow, serif h1, lead, actions, and the illustration stage. */
export function PubHero({
  crumbs, eyebrow, title, lead, art, tint, actions, meta, compact, children,
}: {
  crumbs: { label: string; to?: string }[];
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  art: ArtName;
  tint: Pastel;
  actions?: ReactNode;
  meta?: ReactNode;
  compact?: boolean;
  children?: ReactNode;
}) {
  return (
    <section className={`sd-hero ${compact ? "sd-pub-compact" : ""}`} style={tintStyle(tint)}>
      <div className="sd-wrap sd-hero-grid">
        <div className="sd-hero-copy">
          <SdCrumbs items={crumbs} />
          {eyebrow && <span className="sd-eyebrow">{eyebrow}</span>}
          <h1 className="sd-h1 mt-5">{title}</h1>
          {lead && <p className="sd-pub-lead">{lead}</p>}
          {meta && <div className="sd-pub-meta">{meta}</div>}
          {actions && <div className="sd-pub-actions">{actions}</div>}
          {children}
        </div>
        <div className="sd-stage" aria-hidden="true">
          <SdPic name={art} sizes="(min-width:1024px) 520px, 90vw" priority />
          <SdStageSpot art={art} />
        </div>
      </div>
    </section>
  );
}

/** Band heading used inside a page: serif h2 with an optional lede. */
export function PubHead({ title, lede }: { title: string; lede?: ReactNode }) {
  return (
    <div className="sd-band-head">
      <h2 className="sd-h2">{title}</h2>
      {lede && <p className="sd-lead">{lede}</p>}
    </div>
  );
}

/** Navy closing block with a call to action (no form), the illustration and direct contact. */
export function PubClose({
  title, text, art, primary = { text: "בדיקת תיק 360", to: "/#portfolio-review" }, secondary = { text: "תיאום פגישה", to: "/contact" }, children,
}: {
  title: string;
  text: string;
  art: ArtName;
  primary?: { text: string; to: string } | null;
  secondary?: { text: string; to: string } | null;
  children?: ReactNode;
}) {
  return (
    <section className="sd-contact sd-pub-close no-print">
      <div className="sd-wrap sd-pub-close-grid">
        <div>
          <h2 className="sd-h2">{title}</h2>
          <p className="sd-text mt-4">{text}</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
            {primary && <Link to={primary.to} className="sd-btn sd-btn-light">{primary.text}{arrow}</Link>}
            {secondary && <Link to={secondary.to} className="sd-link-light">{secondary.text}{arrow}</Link>}
            {children}
          </div>
          <div className="sd-reach mt-6">
            <a href="tel:0523097444" dir="ltr" style={{ justifyContent: "flex-end" }}>052-309-7444</a>
            <a href="mailto:info@seeld.co.il" dir="ltr" style={{ justifyContent: "flex-end" }}>info@seeld.co.il</a>
          </div>
        </div>
        <div className="sd-contact-art" aria-hidden="true"><SdPic name={art} sizes="360px" /></div>
      </div>
    </section>
  );
}

/** Article card: pastel illustration plate on top (or the post's own photo), text below. */
export function PubArticleCard({
  to, title, meta, excerpt, art, tone, photo, kicker, cta = "לקריאה", heading: H = "h3",
}: {
  to: string;
  title: string;
  meta?: ReactNode;
  excerpt?: string | null;
  art: ArtName;
  tone: Pastel;
  photo?: string | null;
  kicker?: string;
  cta?: string;
  heading?: "h2" | "h3";
}) {
  const band = { ["--band" as string]: PASTELS[tone].bg } as CSSProperties;
  return (
    <Link to={to} className="sd-pub-card sd-reveal group">
      <div className={`sd-pub-card-art ${photo ? "is-photo" : ""}`} style={band} aria-hidden="true">
        {photo ? <img src={photo} alt="" loading="lazy" decoding="async" /> : <SdPic name={art} sizes="(min-width:1024px) 360px, 90vw" />}
      </div>
      <div className="sd-pub-card-body">
        {kicker && <span className="sd-pub-card-kicker">{kicker}</span>}
        <H>{title}</H>
        {meta && <p className="sd-pub-card-meta">{meta}</p>}
        {excerpt && <p className="sd-pub-excerpt">{excerpt}</p>}
        <span className="sd-pub-card-cta"><span>{cta}</span>{arrow}</span>
      </div>
    </Link>
  );
}

/** Wrapper of every pub page: kit scope, topic tint, kit font. */
export const pubRootStyle = (tint: Pastel) => tintStyle(tint);

export { SdBand };

/** Adds ids to the h2 headings of an HTML string and returns the table of contents. Text is untouched. */
export function withHeadingIds(html: string): { html: string; toc: { id: string; label: string }[] } {
  const toc: { id: string; label: string }[] = [];
  let n = 0;
  const out = html.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (m, attrs: string, inner: string) => {
    const label = inner.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (!label) return m;
    n += 1;
    const existing = /\sid\s*=\s*["']([^"']+)["']/i.exec(attrs);
    const id = existing ? existing[1] : `sec-${n}`;
    toc.push({ id, label });
    return existing ? m : `<h2${attrs} id="${id}">${inner}</h2>`;
  });
  return { html: out, toc };
}

/** Collapsible table of contents for phones (hidden from 1024px up). Real links in the DOM. */
export function PubTocInline({ items }: { items: { id: string; label: string }[] }) {
  if (items.length < 2) return null;
  return (
    <>
      <SdProgress />
      <details className="sd-toc-inline">
        <summary>תוכן העניינים</summary>
        <nav aria-label="תוכן העניינים">
          {items.map((s) => <a key={s.id} href={`#${s.id}`}>{s.label}</a>)}
        </nav>
      </details>
    </>
  );
}

/** Sticky aside of reading pages: table of contents and a contextual illustration (desktop only). */
export function PubTocAside({ items, art, tone }: { items: { id: string; label: string }[]; art: ArtName; tone: Pastel }) {
  const band = { ["--band" as string]: PASTELS[tone].bg } as CSSProperties;
  return (
    <aside className="sd-read-aside">
      {items.length > 1 && (
        <nav className="sd-toc" aria-label="תוכן העניינים (צד)">
          <b>בעמוד הזה</b>
          {items.map((s) => <a key={s.id} href={`#${s.id}`}>{s.label}</a>)}
        </nav>
      )}
      <div className="sd-read-art" style={band} aria-hidden="true"><SdPic name={art} sizes="300px" /></div>
    </aside>
  );
}
