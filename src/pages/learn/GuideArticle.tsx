import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnswerSummary from "@/components/AnswerSummary";
import NotFound from "@/pages/NotFound";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { SdBand, tintStyle, useSdFont } from "@/components/sd/primitives";
import {
  PubArticleCard, PubClose, PubHead, PubHero, PubTocAside, companionArt,
} from "@/components/sd/pub";
import { KnowledgeBar, KnowledgePlate, KnowledgeStamp } from "@/components/sd/knowledge";
import { SdProgress } from "@/components/sd/primitives";
import type { SpotName } from "@/components/sd/spots";
import { PAPER_BY_CATEGORY, artForSlug } from "@/data/knowledge/art";
import { ROUTE_BY_PATH, labelFromTitle } from "@/data/seo/routes";
import { EXAMPLE_LABEL, TAX_YEAR, type GuideBlock, type GuideSource } from "@/data/knowledge/types";
import { RP_CASE_LABEL, RP_CONTACT } from "@/data/retirementPlanning";
import { KNOWLEDGE_REG_LINE } from "@/data/knowledge/regLine";
import {
  TAX_BASE, categoryFor, catalogBySlug, catalogFor, loadKnowledgeModule, pathOf,
  type KnowledgeModule, type KnowledgeSection,
} from "@/data/knowledge";
import "@/components/sd/sd.css";
import "@/components/sd/pub.css";
import "@/components/sd/knowledge.css";
import "@/components/retire/retire.css";

// One reading page for /learn/guides/:slug and /learn/pension-tax/:slug. Copy lives in
// src/data/knowledge/guides|tax/<slug>.ts, title/description/summary in the registry. The page never calls
// usePageSeo: RouteSeo already sets the registry title, description, canonical and JSON-LD.
// One h1 (the hero), all text in the DOM, unknown or missing slug renders NotFound in place.

const arrow = <BrandIcon name="arrow-left" size={18} />;
const CTA_TEXT = "שיחת היכרות ראשונה, בלי התחייבות מצידכם";
const JANUARY_NOTE = "המספרים מתעדכנים בכל ינואר, לאחר בדיקה מול לוח העזר של רשות המסים.";
const ATTENTION_LABEL = "שימו לב";

const isNumericCell = (v: string) => /\d/.test(v) && !/[֐-׿]/.test(v);

function Callout({ block }: { block: Extract<GuideBlock, { t: "callout" }> }) {
  const eyebrow = block.kind === "example" ? EXAMPLE_LABEL : block.kind === "field" ? RP_CASE_LABEL : ATTENTION_LABEL;
  return (
    <aside className={`dna-callout sd-kn-callout sd-kn-${block.kind}`} style={{ marginBlock: "1.6em" }}>
      <span className="sd-eyebrow">{eyebrow}</span>
      {block.title && block.title !== eyebrow && <b className="block mt-2" style={{ color: "var(--ink)" }}>{block.title}</b>}
      <p className="mt-2" style={{ fontSize: 17, lineHeight: 1.8 }}>{block.text}</p>
    </aside>
  );
}

function DataTable({ caption, head, rows }: { caption: string; head: string[]; rows: string[][] }) {
  return (
    <div className="sd-pub-scroll" style={{ marginBlock: "1.6em" }}>
      <table className="dna-data">
        <caption className="px-4 py-3 text-start text-[15px] font-bold" style={{ color: "var(--ink)" }}>{caption}</caption>
        <thead>
          <tr>{head.map((h, i) => <th key={i} scope="col">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                isNumericCell(cell)
                  ? <td key={ci} dir="ltr" className="num tabular-nums whitespace-nowrap">{cell}</td>
                  : <td key={ci} className="tabular-nums">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Sources({ items }: { items: GuideSource[] }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby="kn-sources" className="mt-12">
      <h2 id="kn-sources" className="sd-h2" style={{ fontSize: 24 }}>מקורות</h2>
      <ul className="mt-3" style={{ listStyle: "disc", paddingInlineStart: 22, lineHeight: 1.8, fontSize: 16 }}>
        {items.map((s) => <li key={`${s.publisher}|${s.label}`}>{s.publisher} · {s.label}</li>)}
      </ul>
    </section>
  );
}

function TaxFigures({ mod }: { mod: KnowledgeModule }) {
  const rows = mod.TAX_FIGURES;
  if (!rows?.length) return null;
  return (
    <section aria-labelledby="kn-figures" className="mt-10">
      <h2 id="kn-figures" className="sd-h2" style={{ fontSize: 26 }}>לוח המספרים</h2>
      <p className="mt-2 text-[15px]" style={{ color: "var(--muted)" }}>{JANUARY_NOTE}</p>
      <div className="sd-pub-scroll mt-4">
        <table className="dna-data">
          <caption className="px-4 py-3 text-start text-[15px] font-bold" style={{ color: "var(--ink)" }}>
            נכון לשנת המס <span dir="ltr" className="tabular-nums">{TAX_YEAR}</span>
          </caption>
          <thead>
            <tr><th scope="col">פריט</th><th scope="col">ערך</th><th scope="col">יחידה</th><th scope="col">בסיס</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.label}</td>
                <td dir="ltr" className="num tabular-nums whitespace-nowrap">{r.value}</td>
                <td>{r.unit ?? ""}</td>
                <td>{r.basis ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function GuideArticle() {
  useSdFont();
  const { pathname } = useLocation();
  const path = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const hit = catalogFor(path);
  const slug = hit?.entry.slug;
  const section: KnowledgeSection | undefined = hit?.section;
  const [state, setState] = useState<{ key: string; mod: KnowledgeModule | null } | null>(null);

  useEffect(() => {
    if (!slug || !section) return;
    let live = true;
    const key = `${section}/${slug}`;
    loadKnowledgeModule(slug, section).then((mod) => { if (live) setState({ key, mod }); });
    return () => { live = false; };
  }, [slug, section]);

  const mod = state && hit && state.key === `${hit.section}/${hit.entry.slug}` ? state.mod : undefined;

  const toc = useMemo(() => {
    let n = 0;
    return (mod?.guide.blocks ?? []).flatMap((b) => (b.t === "h2" ? [{ id: `sec-${++n}`, label: b.text }] : []));
  }, [mod]);

  if (!hit) return <NotFound />;
  if (mod === null) return <NotFound />;

  const cat = categoryFor(hit.entry.category);
  const isTax = hit.section === "tax";
  const hubPath = isTax ? TAX_BASE : "/learn/guides";
  const art = artForSlug(hit.entry.slug);
  const paper = `sd-kn-paper sd-kn-${PAPER_BY_CATEGORY[hit.entry.category]}`;

  if (mod === undefined) {
    return (
      <div className="sd min-h-screen" dir="rtl" style={tintStyle(cat.tone)}>
        <Header />
        <main><p className="sd-wrap py-24 text-[16px]" style={{ color: "var(--muted)" }} role="status">טוענים את הדף.</p></main>
        <Footer />
      </div>
    );
  }

  const { guide } = mod;
  const sources: GuideSource[] = [...guide.sources];
  for (const s of mod.TAX_SOURCES ?? []) {
    if (!sources.some((x) => x.label === s.label && x.publisher === s.publisher)) sources.push(s);
  }

  const further = guide.further.flatMap((fs) => {
    const h = catalogBySlug(fs);
    if (!h) return [];
    const p = pathOf(h.section, fs);
    const reg = ROUTE_BY_PATH[p];
    return [{ path: p, title: reg ? labelFromTitle(reg.title) : fs, excerpt: reg?.description, cat: categoryFor(h.entry.category) }];
  });

  let h2n = 0;
  let plated = false;
  const crumbs = isTax
    ? [{ label: "דף הבית", to: "/" }, { label: "מדריכים", to: "/learn/guides" }, { label: cat.title, to: TAX_BASE }]
    : [{ label: "דף הבית", to: "/" }, { label: "מדריכים", to: "/learn/guides" }, { label: cat.title }];

  return (
    <div className="sd min-h-screen" dir="rtl" style={tintStyle(cat.tone)}>
      <Header />
      <main>
        <PubHero
          crumbs={crumbs}
          eyebrow={cat.title}
          title={guide.title}
          lead={guide.lead}
          art={cat.art}
          tint={cat.tone}
          spot={art.spot as SpotName}
          compact
          className="sd-kn-hero"
          meta={
            <KnowledgeStamp art={art}>
              <span dir="ltr" className="tabular-nums">{hit.entry.readMinutes}</span> דקות קריאה
            </KnowledgeStamp>
          }
        >
          <div className="sd-brief">
            <b>בקצרה</b>
            <AnswerSummary className="" />
          </div>
        </PubHero>

        {toc.length > 1 && <SdProgress />}
        <KnowledgeBar items={toc} home={{ to: hubPath, label: isTax ? "פרקי המיסוי" : "המדריכים" }} article ariaLabel="תוכן העניינים" />

        <SdBand tone="white" id="post" art={false} className={paper}>
          <div className="sd-wrap sd-read-layout">
            <article className="sd-read-col sd-kn-sheet">
              <div className="sd-prose">
                {guide.blocks.map((b, i) => {
                  switch (b.t) {
                    case "p":
                      if (!plated) {
                        plated = true;
                        return [<p key={i}>{b.text}</p>, <KnowledgePlate key={`plate-${i}`} art={art} label={cat.title} />];
                      }
                      return <p key={i}>{b.text}</p>;
                    case "h2":
                      return <h2 key={i} id={`sec-${++h2n}`}>{b.text}</h2>;
                    case "table":
                      return <DataTable key={i} caption={b.caption} head={b.head} rows={b.rows} />;
                    case "callout":
                      return <Callout key={i} block={b} />;
                    default:
                      return null;
                  }
                })}
              </div>
              {hit.entry.slug === "numbers" && <TaxFigures mod={mod} />}
              <Sources items={sources} />
              <p className="mt-10">
                <Link to={hubPath} className="sd-link">{isTax ? "לכל פרקי המיסוי" : "לכל המדריכים"}{arrow}</Link>
              </p>
            </article>
            <PubTocAside items={toc} art={companionArt(cat.art)} tone={cat.tone === "sage" ? "butter" : "sage"} />
          </div>
        </SdBand>

        {further.length > 0 && (
          <SdBand tone="cream" id="further" art={false}>
            <div className="sd-wrap">
              <PubHead title="להמשך קריאה" />
              <div className="sd-pub-grid sd-pub-grid-2">
                {further.map((f) => (
                  <PubArticleCard
                    key={f.path}
                    to={f.path}
                    title={f.title}
                    kicker={f.cat.title}
                    excerpt={f.excerpt}
                    art={f.cat.art}
                    tone={f.cat.tone}
                  />
                ))}
              </div>
            </div>
          </SdBand>
        )}

        <PubClose
          title="רוצים לבדוק מה מתאים למצב שלכם?"
          text="בשיחה קצרה נעבור על התמונה שלכם ונסביר את האפשרויות, בקצב שלכם."
          art="33-welcome-table"
          primary={{ text: CTA_TEXT, to: isTax ? RP_CONTACT : "/contact" }}
          secondary={null}
        />
        <div className="sd-rp-reg">
          <div className="sd-wrap"><p>{KNOWLEDGE_REG_LINE}</p></div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
