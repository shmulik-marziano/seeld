// Document card (spec ס4): the fixed rows from the template, the fixed line about the licensee, and "צפייה במסמך".
// While the template is not approved the validity and scope rows are hidden (spec §4); a row with no template value
// is never shown.
import type { PoaKind } from "@/lib/poa/config";
import { POA_COPY as C, POA_TEMPLATE_PLACEHOLDER, type CardRowKey, type PoaTemplate } from "@/lib/poa/copy";
import { DocPreview } from "./DocPreview";

const ROWS: CardRowKey[] = ["whom", "scope", "validity", "revoke"];
const GATED: CardRowKey[] = ["scope", "validity"];

function visibleRows(t: PoaTemplate): CardRowKey[] {
  return ROWS.filter((r) => (t.approved || !GATED.includes(r)) && t.rows[r].trim() !== "");
}

export function DocCard({ kind, pdf, template = POA_TEMPLATE_PLACEHOLDER[kind] }: { kind: PoaKind; pdf: Blob | null; template?: PoaTemplate }) {
  const lineId = `poa-${kind}-fixed`;
  return (
    <div className="sd-poa-doc">
      <p className="sd-poa-doc-title">{C.docTitle[kind]}</p>
      <dl className="sd-poa-rows">
        {visibleRows(template).map((r) => (
          <div key={r}>
            <dt>{C.card.labels[r]}</dt>
            <dd>{template.rows[r]}</dd>
          </div>
        ))}
      </dl>
      <p id={lineId} className="sd-poa-fixed">{C.card.fixedLine}</p>
      <DocPreview pdf={pdf} describedBy={lineId} />
    </div>
  );
}
