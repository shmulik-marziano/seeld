import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { SdArtLayer, SdBand, SdCrumbs, SdPic, SdProgress, SdStageSpot, tintStyle } from "./primitives";
import { PASTELS, type ArtName, type Pastel, type Topic } from "./topics";
import { SdSpot } from "./SdSpot";
import { ContactIcons } from "./ContactIcons";
import { spotAt } from "./spots";
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
  rights: { art: "30-rights-found-key", art2: "32-process-steps", palette: ["rose", "sage", "butter"] },
  directDebit: { art: "28-direct-debit-calendar", art2: "10-financial-planning", palette: ["sky", "butter", "sage"] },
  onboarding: { art: "29-onboarding-door", art2: "01-hero", palette: ["sage", "sky", "butter"] },
} satisfies Record<string, Topic>;

const TONES: Pastel[] = ["sage", "sky", "butter", "rose", "lavender"];
export const toneAt = (i: number): Pastel => TONES[((i % TONES.length) + TONES.length) % TONES.length];

/** Illustration (and colour) that fits an article by its category and title. */
export function artForText(category: string | null | undefined, title = ""): { art: ArtName; tone: Pastel } {
  const t = `${category ?? ""} ${title}`;
  if (/ילד|ילדים|חינוך|לימודים/.test(t)) return { art: "41-object-school-bag", tone: "sage" };
  if (/דמי ניהול|תקציב|הוצאות|חוב|הלוואה/.test(t)) return { art: "35-object-wallet", tone: "rose" };
  if (/פרישה|פנסיה|קצבה|גמלאות|זמן|ותק/.test(t)) return { art: "37-object-hourglass", tone: "sky" };
  if (/משכנתא|דירה|נדל/.test(t)) return { art: "36-object-house-key", tone: "sage" };
  if (/רכב|תאונת דרכים/.test(t)) return { art: "39-object-car-key", tone: "lavender" };
  if (/עסק/.test(t)) return { art: "08-business-insurance", tone: "butter" };
  if (/נסיעות|חו.?ל/.test(t)) return { art: "40-object-suitcase", tone: "rose" };
  if (/בריאות|סיעוד|כושר|מחלה|רפוא/.test(t)) return { art: "38-object-health-bag", tone: "butter" };
  if (/חיים|משפחה|שאירים/.test(t)) return { art: "02-family-protection", tone: "sage" };
  if (/חיסכון|השקע|גמל|השתלמות|ריבית|מדד/.test(t)) return { art: "04-investments-growth", tone: "butter" };
  if (/תקציב|תכנון|פיננס/.test(t)) return { art: "10-financial-planning", tone: "lavender" };
  if (/מסמכ|טפסים|שירות|זכויות|תביע|תלוש/.test(t)) return { art: "11-claims-service", tone: "sage" };
  if (/ביטוח|פוליס|כיסוי|טעויות/.test(t)) return { art: "34-object-umbrella", tone: "lavender" };
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
  "13-nursing-care": "lavender", "14-accidents-recovery": "butter", "15-critical-illness": "rose", "16-disability-income": "sky", "17-child-savings-sailboat": "rose",
  "18-partners-agreement": "butter", "19-renters-first-home": "sage", "20-vehicle-road": "sky", "21-dental-calm": "sky", "22-foreign-caregiver": "sage", "23-training-desk": "lavender", "24-pension-family-umbrella": "lavender", "25-employer-employee": "butter", "26-pre-retirement-path": "butter", "27-post-retirement-bench": "sage", "28-direct-debit-calendar": "sky", "29-onboarding-door": "sky", "30-rights-found-key": "rose", "31-team-desks": "sage", "32-process-steps": "sage", "33-welcome-table": "butter",
  "34-object-umbrella": "lavender", "35-object-wallet": "rose", "36-object-house-key": "sage", "37-object-hourglass": "sky", "38-object-health-bag": "butter", "39-object-car-key": "lavender", "40-object-suitcase": "rose", "41-object-school-bag": "sage",
};
const ART_POOL: ArtName[] = [
  "04-investments-growth", "10-financial-planning", "05-retirement", "02-family-protection", "03-health-insurance", "11-claims-service",
  "12-childrens-savings", "06-home-mortgage", "08-business-insurance", "01-hero", "07-car-insurance", "09-travel-insurance",
  "13-nursing-care", "14-accidents-recovery", "15-critical-illness", "16-disability-income", "17-child-savings-sailboat",
  "18-partners-agreement", "19-renters-first-home", "20-vehicle-road", "21-dental-calm", "22-foreign-caregiver", "23-training-desk", "24-pension-family-umbrella", "25-employer-employee", "26-pre-retirement-path", "27-post-retirement-bench", "28-direct-debit-calendar", "29-onboarding-door", "30-rights-found-key", "31-team-desks", "32-process-steps", "33-welcome-table",
  "34-object-umbrella", "35-object-wallet", "36-object-house-key", "37-object-hourglass", "38-object-health-bag", "39-object-car-key", "40-object-suitcase", "41-object-school-bag",
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
  "13-nursing-care": ["05-retirement", "02-family-protection", "03-health-insurance"],
  "14-accidents-recovery": ["03-health-insurance", "11-claims-service", "07-car-insurance"],
  "15-critical-illness": ["03-health-insurance", "02-family-protection", "13-nursing-care"],
  "16-disability-income": ["10-financial-planning", "11-claims-service", "02-family-protection"],
  "17-child-savings-sailboat": ["12-childrens-savings", "04-investments-growth", "02-family-protection"],
  "18-partners-agreement": ["08-business-insurance", "10-financial-planning"],
  "19-renters-first-home": ["06-home-mortgage", "11-claims-service"],
  "20-vehicle-road": ["07-car-insurance", "01-hero"],
  "21-dental-calm": ["03-health-insurance", "11-claims-service"],
  "22-foreign-caregiver": ["09-travel-insurance", "03-health-insurance"],
  "23-training-desk": ["10-financial-planning", "04-investments-growth"],
  "24-pension-family-umbrella": ["02-family-protection", "05-retirement"],
  "25-employer-employee": ["08-business-insurance", "04-investments-growth"],
  "26-pre-retirement-path": ["05-retirement", "10-financial-planning"],
  "27-post-retirement-bench": ["05-retirement", "13-nursing-care"],
  "28-direct-debit-calendar": ["10-financial-planning", "04-investments-growth"],
  "29-onboarding-door": ["01-hero", "11-claims-service"],
  "30-rights-found-key": ["10-financial-planning", "11-claims-service"],
  "31-team-desks": ["08-business-insurance", "11-claims-service"],
  "32-process-steps": ["11-claims-service", "01-hero"],
  "33-welcome-table": ["01-hero", "11-claims-service"],
  "34-object-umbrella": ["02-family-protection", "01-hero"],
  "35-object-wallet": ["10-financial-planning", "04-investments-growth"],
  "36-object-house-key": ["06-home-mortgage", "01-hero"],
  "37-object-hourglass": ["05-retirement", "10-financial-planning"],
  "38-object-health-bag": ["03-health-insurance", "02-family-protection"],
  "39-object-car-key": ["07-car-insurance", "01-hero"],
  "40-object-suitcase": ["09-travel-insurance", "01-hero"],
  "41-object-school-bag": ["12-childrens-savings", "02-family-protection"],
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
      <SdArtLayer name={companionArt(art)} className="sd-hero-art" />
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
      <SdArtLayer name={companionArt(art)} className="sd-band-art sd-contact-layer" />
      <span className="sd-band-ghost sd-contact-ghost" aria-hidden="true"><SdSpot name={spotAt(art, 1)} size={220} /></span>
      <span className="sd-band-div sd-contact-seam" aria-hidden="true"><SdSpot name={spotAt(art, 0)} size={110} /></span>      <div className="sd-wrap sd-pub-close-grid">
        <div>
          <h2 className="sd-h2">{title}</h2>
          <p className="sd-text mt-4">{text}</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
            {primary && <Link to={primary.to} className="sd-btn sd-btn-light">{primary.text}{arrow}</Link>}
            {secondary && <Link to={secondary.to} className="sd-link-light">{secondary.text}{arrow}</Link>}
            {children}
          </div>
          <div className="sd-reach mt-6">
            <ContactIcons tone="light" />
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
