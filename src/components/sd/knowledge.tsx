import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useActiveSection } from "@/components/inst/useActiveSection";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { SdSpot } from "./SdSpot";
import { SdIcon } from "./primitives";
import type { SpotName } from "./spots";
import type { KnowledgeArt } from "@/data/knowledge/art";
import type { GlossaryTerm } from "@/data/glossary";
import "./knowledge.css";

/*
  Knowledge section building blocks (design pass 23.11.2026):
  - KnowledgePlate: the one pencil drawing inside the reading column (decorative, lazy, sized).
  - KnowledgeStamp: the kit icon next to the reading time in the hero.
  - KnowledgeBar: the sticky section strip of every knowledge page (active section, pills, edge fades, 44px).
  - Glossary: alphabet rail + grouped terms with a letter mark, live search with a count.
*/

const SPOT_W = 300;

/** One pencil drawing on a soft plate inside the reading column. `label` is the small tag (digit-free). */
export function KnowledgePlate({ art, label }: { art: KnowledgeArt; label?: string }) {
  return (
    <figure className="sd-kn-plate" aria-hidden="true">
      <SdSpot name={art.spot as SpotName} size={SPOT_W} />
      {label && (
        <span className="sd-kn-plate-tag">
          <img src={`/art/icons/${art.icon}.svg`} alt="" width={20} height={20} loading="lazy" decoding="async" />
          {label}
        </span>
      )}
    </figure>
  );
}

/** Kit icon stamp with the hero meta text beside it (reading time). */
export function KnowledgeStamp({ art, children }: { art: KnowledgeArt; children: ReactNode }) {
  return (
    <span className="sd-kn-stamp">
      <SdIcon name={art.icon} size={34} />
      <span>{children}</span>
    </span>
  );
}

export interface BarItem { id: string; label: string }

/**
 * Sticky section bar. Real anchors (works without JS and in the prerender); the active pill follows the section
 * under the header and is kept in view inside the strip without moving the page.
 */
export function KnowledgeBar({ items, home, article, ariaLabel = "תוכן העמוד" }: { items: BarItem[]; home?: { to: string; label: string }; article?: boolean; ariaLabel?: string }) {
  const active = useActiveSection(items.map((s) => s.id));
  const strip = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const nav = strip.current;
    if (!nav || !active) return;
    const el = nav.querySelector<HTMLAnchorElement>(`a[href="#${CSS.escape(active)}"]`);
    if (!el) return;
    const n = nav.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const delta = r.left + r.width / 2 - (n.left + n.width / 2);
    if (Math.abs(delta) > 8) nav.scrollBy({ left: delta, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [active]);
  if (items.length < 2 && !home) return null;
  return (
    <nav className={`sd-subnav sd-subnav-kn ${article ? "sd-subnav-article" : ""}`} aria-label={ariaLabel}>
      <div ref={strip} className="sd-wrap sd-subnav-in">
        {home && <Link to={home.to} className="sd-subnav-home"><BrandIcon name="arrow-left" size={14} />{home.label}</Link>}
        {items.map((s) => (
          <a key={s.id} href={`#${s.id}`} aria-current={active === s.id ? "true" : undefined}>{s.label}</a>
        ))}
      </div>
    </nav>
  );
}

/* ---------------------------------------------------------------- glossary */

const ALEPHBET = [..."אבגדהוזחטיכלמנסעפצקרשת"];
const FINALS: Record<string, string> = { ך: "כ", ם: "מ", ן: "נ", ף: "פ", ץ: "צ" };
const ORDER = new Map(ALEPHBET.map((l, i) => [l, i]));

/** First Hebrew letter of a term (finals folded), or null when the term starts with something else. */
export function letterOf(term: string): string | null {
  for (const ch of term) {
    const base = FINALS[ch] ?? ch;
    if (ORDER.has(base)) return base;
  }
  return null;
}

const collate = (a: string, b: string) => {
  const la = letterOf(a), lb = letterOf(b);
  const d = (la ? ORDER.get(la)! : 99) - (lb ? ORDER.get(lb)! : 99);
  return d !== 0 ? d : a.localeCompare(b, "he");
};

/** Terms sorted in Hebrew alphabetical order and grouped by first letter (letters that have terms only). */
export function groupTerms(terms: GlossaryTerm[]): { letter: string; terms: GlossaryTerm[] }[] {
  const sorted = [...terms].sort((a, b) => collate(a.term, b.term));
  const groups: { letter: string; terms: GlossaryTerm[] }[] = [];
  for (const t of sorted) {
    const letter = letterOf(t.term) ?? "•";
    const g = groups[groups.length - 1];
    if (g && g.letter === letter) g.terms.push(t);
    else groups.push({ letter, terms: [t] });
  }
  return groups;
}

function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q);
  if (i < 0) return <>{text}</>;
  return <>{text.slice(0, i)}<mark>{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>;
}

const countLabel = (n: number, total: number) => (n === total ? "כל המונחים" : n === 1 ? "מונח אחד" : "מונחים");

/** True from the tablet breakpoint up (true before hydration too, so the prerender carries every definition open). */
function useWide(min = 900) {
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${min}px)`);
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [min]);
  return wide;
}

/**
 * The glossary block: search with a live count, alphabet rail and the terms grouped by letter. Every term stays in the DOM;
 * on phones each definition folds under its term (open while a search is active), from 900px up all are open.
 */
export function Glossary({ terms, onAsk }: { terms: GlossaryTerm[]; onAsk?: () => void }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = useMemo(() => (q ? terms.filter((g) => g.term.toLowerCase().includes(q) || g.body.toLowerCase().includes(q)) : terms), [terms, q]);
  const groups = useMemo(() => groupTerms(shown), [shown]);
  const present = new Set(groups.map((g) => g.letter));
  const ids = groups.map((g) => `gl-${g.letter}`);
  const active = useActiveSection(ids);
  const wide = useWide();
  const open = wide || q.length > 0;

  return (
    <div className="sd-gl-wrap">
      <div className="sd-gl-top">
        <div>
          <label htmlFor="glossary-search" className="block text-[14px] font-bold mb-1.5" style={{ color: "var(--ink)" }}>חיפוש מונח</label>
          <input id="glossary-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} className="field" autoComplete="off" placeholder="למשל: דמי ניהול" />
        </div>
        <p className="sd-gl-count" role="status" aria-live="polite">
          {shown.length === total(terms) ? <b>{countLabel(shown.length, terms.length)}</b> : <><b dir="ltr" className="tabular-nums">{shown.length}</b> {countLabel(shown.length, terms.length)}</>}
          {" · "}לפי סדר האלף־בית
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="sd-gl-empty">
          <p className="text-[17px] font-bold" style={{ color: "var(--ink)" }}>לא נמצאו מונחים</p>
          <p className="mt-2 text-[16px]">נסו מילה אחרת{onAsk ? ", או שאלו אותנו" : ""}.</p>
          <div className="mt-5 flex flex-wrap items-center gap-5">
            <button type="button" onClick={() => setQuery("")} className="btn-secondary">ניקוי החיפוש</button>
            {onAsk && <button type="button" onClick={onAsk} className="sd-link"><BrandIcon name="message" size={18} />שאלו את היועץ הדיגיטלי</button>}
          </div>
        </div>
      ) : (
        <div className="sd-gl">
          <nav className="sd-gl-rail" aria-label="אותיות המונחון">
            {ALEPHBET.map((l) => (present.has(l)
              ? <a key={l} href={`#gl-${l}`} aria-current={active === `gl-${l}` ? "true" : undefined} aria-label={`מונחים באות ${l}`}>{l}</a>
              : <span key={l} aria-hidden="true">{l}</span>))}
          </nav>
          <div className="sd-gl-groups">
            {groups.map((g) => (
              <section key={g.letter} id={`gl-${g.letter}`} className="sd-gl-group" aria-label={`האות ${g.letter}`}>
                <span className="sd-gl-letter" aria-hidden="true">{g.letter}</span>
                <div className="sd-gl-list">
                  {g.terms.map((t) => (
                    <details key={t.term} className="sd-gl-term" open={open}>
                      <summary>
                        <span className="sd-gl-mark" aria-hidden="true">{letterOf(t.term) ?? "•"}</span>
                        <span className="sd-gl-dt"><Highlight text={t.term} q={q} /></span>
                      </summary>
                      <div className="sd-gl-dd">
                        <Highlight text={t.body} q={q} />
                        {t.more && <> <Link to={t.more} className="sd-link">איפה זה מופיע<BrandIcon name="arrow-left" size={16} /></Link></>}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const total = (t: GlossaryTerm[]) => t.length;
