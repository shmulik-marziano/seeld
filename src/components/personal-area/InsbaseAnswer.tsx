import { BODY, GREEN, LINE, MUTED } from "@/lib/brand";

/**
 * Renders one InsBase answer: the ready Hebrew text with its source line.
 * Lines that start with "·" become list items; **bold** is honoured; the
 * "— מקור:" line and the parenthesised freshness note are set in the muted
 * tone. Nothing else is touched: the text is the agency's, verbatim.
 */
const Inline = ({ text }: { text: string }) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} style={{ color: GREEN }}>{p.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
};

export const InsbaseAnswer = ({ text, compact = false }: { text: string; compact?: boolean }) => {
  const lines = text.split("\n");
  const blocks: { kind: "p" | "li" | "src" | "note" | "h"; text: string }[] = [];
  for (const raw of lines) {
    const l = raw.trim();
    if (!l) continue;
    if (l.startsWith("— מקור") || l.startsWith("—מקור")) blocks.push({ kind: "src", text: l.replace(/^—\s*/, "") });
    else if (l.startsWith("(") && l.endsWith(")")) blocks.push({ kind: "note", text: l.slice(1, -1) });
    else if (l.startsWith("·") || l.startsWith("•") || /^\d+\.\s/.test(l)) blocks.push({ kind: "li", text: l.replace(/^[·•]\s*/, "") });
    else if (l.endsWith(":") && l.length < 60) blocks.push({ kind: "h", text: l.slice(0, -1) });
    else blocks.push({ kind: "p", text: l });
  }
  // The first line of a multi-line answer is its title
  const first = blocks[0]?.kind === "p" && blocks.length > 1 ? blocks.shift() : null;

  return (
    <div className={compact ? "text-[15px]" : "text-[16px]"} style={{ color: BODY }}>
      {first && !compact && <p className="text-[20px] font-bold leading-tight mb-3" style={{ color: GREEN }}>{first.text}</p>}
      {first && compact && <p className="font-bold mb-2" style={{ color: GREEN }}>{first.text}</p>}
      {blocks.map((b, i) => {
        if (b.kind === "h") return <p key={i} className="mt-4 mb-1.5 font-bold" style={{ color: GREEN }}>{b.text}</p>;
        if (b.kind === "li") return (
          <div key={i} className="flex gap-3 py-2 border-b last:border-b-0" style={{ borderColor: "#E1E8E1" }}>
            <span aria-hidden="true" className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: GREEN }} />
            <p className="leading-[1.6] tabular-nums"><Inline text={b.text} /></p>
          </div>
        );
        if (b.kind === "src") return <p key={i} className="mt-4 pt-3 border-t text-[14px]" style={{ color: MUTED, borderColor: LINE }}>{b.text}</p>;
        if (b.kind === "note") return <p key={i} className="mt-2 text-[14px]" style={{ color: MUTED }}>{b.text}</p>;
        return <p key={i} className="leading-[1.7] tabular-nums my-1.5"><Inline text={b.text} /></p>;
      })}
    </div>
  );
};

export default InsbaseAnswer;
