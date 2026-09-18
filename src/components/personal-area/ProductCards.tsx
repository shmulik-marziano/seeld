import { BrandIcon } from "@/components/brand/BrandIcon";
import type { InsbaseProduct } from "@/lib/insbase";
import { BODY, GREEN, LINE, MUTED, PASTEL_SAGE, PASTEL_SAND } from "@/lib/brand";

/**
 * The product cards from the app mock ("הביטוחים שלי"): an icon disc by kind,
 * the product in the customer's words, the company and the number, a status
 * chip, and up to six facts, each with its source and date. Rendered only
 * when the InsBase server sent structured data; otherwise the text answer stands.
 */
export const ProductCards = ({ products, kind }: { products: InsbaseProduct[]; kind?: "savings" | "insurance" }) => {
  const list = kind ? products.filter((p) => p.kind === kind) : products;
  if (list.length === 0) {
    return <p className="text-[15px]" style={{ color: MUTED }}>אין מוצרים מהסוג הזה בתיק.</p>;
  }
  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {list.map((p) => (
        <li key={p.policy_number} className="rounded-2xl bg-white border p-4 sm:p-5" style={{ borderColor: LINE }}>
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full" style={{ background: p.kind === "savings" ? PASTEL_SAGE : PASTEL_SAND }}>
              <BrandIcon name={p.kind === "savings" ? "leaf" : "shield"} size={22} style={{ color: GREEN }} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h4 className="text-[17px] font-bold leading-tight" style={{ color: GREEN }}>
                  {p.product_type} ב{p.producer}
                </h4>
                <span
                  className="rounded-full px-2.5 py-0.5 text-[13px] font-bold"
                  style={p.active ? { background: PASTEL_SAGE, color: GREEN } : { background: "#E1E8E1", color: "#476356" }}
                >
                  {p.status}
                </span>
              </div>
              <p className="mt-1 text-[14px] tabular-nums" style={{ color: MUTED }}>
                {p.plan_name ? `${p.plan_name} · ` : ""}חשבון <span dir="ltr">{p.policy_number}</span>
              </p>
            </div>
          </div>
          {p.highlights.length > 0 && (
            <dl className="mt-4 divide-y divide-[#E1E8E1] border-t" style={{ borderColor: "#E1E8E1" }}>
              {p.highlights.map((h, i) => (
                <div key={i} className="flex items-baseline justify-between gap-4 py-2">
                  <dt className="text-[14px]" style={{ color: MUTED }}>{h.label}</dt>
                  <dd className="text-[15px] font-bold text-left tabular-nums" style={{ color: BODY }}>{h.display}</dd>
                </div>
              ))}
            </dl>
          )}
          <p className="mt-3 text-[13.5px]" style={{ color: MUTED }}>
            מקור: {p.source} · נכון ל-<span dir="ltr" className="tabular-nums">{p.valid_date}</span>
          </p>
        </li>
      ))}
    </ul>
  );
};

export default ProductCards;
