import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { BrandIcon, type BrandIconName } from "@/components/brand/BrandIcon";
import { InsbaseAnswer } from "./InsbaseAnswer";
import { InsbaseConnectCard } from "./InsbaseConnectCard";
import PoliciesTab from "./PoliciesTab";
import { callTool, type InsbaseLink, type InsbaseProduct, type InsbaseTool } from "@/lib/insbase";
import { ProductCards } from "./ProductCards";
import { BODY, GREEN, LINE, MUTED, PASTEL_MINT, PASTEL_SAGE, PASTEL_SAND, TINT_SAGE } from "@/lib/brand";

/**
 * "התיק שלי" — the file tab. When the InsBase link exists, the sections are
 * the agency's own answers (snapshot, money, cover, recommendations, changes,
 * a term explainer). Products the visitor added by hand sit below, always.
 */

type Section = { key: string; label: string; icon: BrandIconName; tint: string; tools: { title: string; tool: InsbaseTool; cards?: "savings" | "insurance" | "all" }[] };

const SECTIONS: Section[] = [
  { key: "snapshot", label: "תמונת מצב", icon: "chart", tint: PASTEL_SAGE, tools: [{ title: "תמונת המצב המלאה", tool: "portfolio_snapshot" }] },
  { key: "money", label: "הכסף שלי", icon: "leaf", tint: PASTEL_SAGE, tools: [
    { title: "צבירות", tool: "balances" },
    { title: "דמי ניהול", tool: "management_fees" },
    { title: "נזילות", tool: "liquidity" },
    { title: "הפקדה אחרונה", tool: "last_deposit" },
  ] },
  { key: "cover", label: "הביטוחים שלי", icon: "heart", tint: PASTEL_SAND, tools: [{ title: "כיסויים ביטוחיים", tool: "coverages" }] },
  { key: "advice", label: "המלצות הסוכנות", icon: "message", tint: PASTEL_MINT, tools: [{ title: "ההמלצות המקצועיות שקיבלתם", tool: "agency_recommendations" }] },
  { key: "changes", label: "מה השתנה", icon: "route", tint: PASTEL_MINT, tools: [{ title: "בין שתי הטעינות האחרונות", tool: "whats_changed" }] },
  { key: "products", label: "רשימת המוצרים", icon: "document", tint: PASTEL_SAND, tools: [{ title: "כל המוצרים", tool: "list_products", cards: "all" }] },
];

const chip = (active: boolean) =>
  `inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 text-[15px] font-bold whitespace-nowrap transition-colors ${active ? "text-[#FAF7EF]" : "bg-white hover:bg-[#EEF2EC]"}`;

const AnswerCard = ({ link, title, tool, args, onLink, cards }: { link: InsbaseLink; title: string; tool: InsbaseTool; args?: Record<string, string>; onLink: (l: InsbaseLink) => void; cards?: "savings" | "insurance" | "all" }) => {
  const [text, setText] = useState<string | null>(null);
  const [products, setProducts] = useState<InsbaseProduct[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setText(null); setProducts(null); setError(null);
    callTool(link, tool, args).then(({ answer, link: l }) => {
      if (!alive) return;
      if (l !== link) onLink(l);
      setText(answer.text);
      if (answer.structured?.products) setProducts(answer.structured.products);
    }).catch(() => alive && setError("התשובה לא נטענה. נסו לרענן, או פתחו פנייה."));
    return () => { alive = false; };
  }, [tool, JSON.stringify(args ?? {})]); // eslint-disable-line react-hooks/exhaustive-deps
  const showCards = cards && products && products.length > 0;
  return (
    <section className="rounded-2xl bg-white border p-5 sm:p-6" style={{ borderColor: LINE }} aria-busy={text === null && !error}>
      <h3 className="text-[18px] leading-tight mb-3" style={{ color: GREEN }}>{title}</h3>
      {error ? (
        <p className="text-[15px]" style={{ color: "#9A4520" }}>{error}</p>
      ) : text === null ? (
        <div className="flex items-center gap-3 py-4" style={{ color: MUTED }}><Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /><span className="text-[15px]">מביאים מהתיק</span></div>
      ) : showCards ? (
        // Structured data from the server: one card per product (app mock). The text stays available below it.
        <>
          <ProductCards products={products!} kind={cards === "all" ? undefined : cards} />
          <details className="mt-4">
            <summary className="cursor-pointer text-[14px] font-bold" style={{ color: GREEN }}>הטקסט המלא של התשובה</summary>
            <div className="mt-3"><InsbaseAnswer text={text} compact /></div>
          </details>
        </>
      ) : (
        <InsbaseAnswer text={text} />
      )}
    </section>
  );
};

const TermExplainer = ({ link, onLink }: { link: InsbaseLink; onLink: (l: InsbaseLink) => void }) => {
  const [term, setTerm] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  return (
    <section className="rounded-2xl p-5 sm:p-6" style={{ background: TINT_SAGE }}>
      <h3 className="text-[18px] leading-tight" style={{ color: GREEN }}>מרכז הידע: מה זה אומר?</h3>
      <p className="mt-1 text-[14px]" style={{ color: MUTED }}>הסבר כללי למונח מהתיק. לא נתון אישי ולא ייעוץ.</p>
      <form className="mt-4 flex flex-col sm:flex-row gap-3" onSubmit={(e) => { e.preventDefault(); if (term.trim()) setAsked(term.trim()); }}>
        <label htmlFor="term-q" className="sr-only">מונח</label>
        <input id="term-q" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="למשל: צבירה, נזילות, מקדם" className="field sm:flex-1" autoComplete="off" />
        <button type="submit" className="btn-secondary w-full sm:w-auto">הסבר</button>
      </form>
      {asked && (
        <div className="mt-4">
          <AnswerCard link={link} title={asked} tool="explain_term" args={{ term: asked }} onLink={onLink} />
        </div>
      )}
    </section>
  );
};

export const FileTab = ({ link, onLink }: { link: InsbaseLink | null; onLink: (l: InsbaseLink) => void }) => {
  const [section, setSection] = useState<string>("snapshot");
  const current = SECTIONS.find((s) => s.key === section) ?? SECTIONS[0];

  return (
    <div className="space-y-8">
      {link ? (
        <>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1" role="tablist" aria-label="חלקי התיק">
            {SECTIONS.map((s) => {
              const active = s.key === section;
              return (
                <button key={s.key} type="button" role="tab" aria-selected={active} onClick={() => setSection(s.key)} className={chip(active)} style={active ? { background: GREEN } : { color: GREEN, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
                  <BrandIcon name={s.icon} size={16} />
                  {s.label}
                </button>
              );
            })}
          </div>
          <div className="space-y-4">
            {current.tools.map((t) => (
              <AnswerCard key={t.tool} link={link} title={t.title} tool={t.tool} onLink={onLink} cards={t.cards} />
            ))}
          </div>
          <TermExplainer link={link} onLink={onLink} />
        </>
      ) : (
        <InsbaseConnectCard />
      )}

      {/* Self-added products, always available */}
      <section className="rounded-2xl bg-white border p-5 sm:p-6" style={{ borderColor: LINE }}>
        <div className="flex items-center gap-3 mb-1">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ background: PASTEL_SAND }}>
            <BrandIcon name="folder" size={22} style={{ color: GREEN }} />
          </span>
          <h3 className="text-[20px] leading-tight" style={{ color: GREEN }}>מוצרים שהוספתם בעצמכם</h3>
        </div>
        <p className="mb-4 text-[15px] leading-[1.6]" style={{ color: BODY }}>
          פוליסות וחסכונות שרשמתם כאן ידנית. אלה לא מגיעים ממקור רשמי, ולכן מוצגים בנפרד מהתיק המחובר.
        </p>
        <PoliciesTab />
      </section>
    </div>
  );
};

export default FileTab;
