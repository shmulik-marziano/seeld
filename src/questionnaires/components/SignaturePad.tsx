// Drawn signature (touch + mouse + pen via pointer events) with undo/clear. The keyboard-accessible alternative is typing the full name,
// handled by the sign step (a tab next to this pad).
import { useCallback, useEffect, useRef, useState } from "react";

export interface SignaturePadProps {
  onChange: (png: string | null) => void; label: string;
  /** optional wording overrides (the POA wizard passes its own copy); defaults are the questionnaires' strings */
  hint?: string; undoLabel?: string; clearLabel?: string;
}
export function SignaturePad({ onChange, label, hint = "חותמים כאן באצבע או בעכבר", undoLabel = "ביטול הקו האחרון", clearLabel = "ניקוי החתימה" }: SignaturePadProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<{ x: number; y: number }[][]>([]);
  const drawing = useRef(false);
  const [count, setCount] = useState(0);

  const paint = useCallback(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext("2d")!;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.lineWidth = 3.2 * (cv.width / cv.clientWidth || 1); ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#203957";
    for (const s of strokes.current) {
      ctx.beginPath();
      s.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      if (s.length === 1) ctx.lineTo(s[0].x + 0.1, s[0].y);
      ctx.stroke();
    }
  }, []);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const fit = () => { const r = cv.getBoundingClientRect(); const d = Math.min(window.devicePixelRatio || 1, 2); cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); paint(); };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [paint]);

  const pos = (e: React.PointerEvent) => {
    const cv = ref.current!; const r = cv.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * cv.width, y: ((e.clientY - r.top) / r.height) * cv.height };
  };
  const emit = () => {
    setCount(strokes.current.length);
    const cv = ref.current!;
    onChange(strokes.current.length ? cv.toDataURL("image/png") : null);
  };
  return (
    <div className="sd-q-sig">
      <canvas ref={ref} className="sd-q-sig-canvas" role="img" aria-label={label}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); drawing.current = true; strokes.current.push([pos(e)]); paint(); }}
        onPointerMove={(e) => { if (!drawing.current) return; strokes.current[strokes.current.length - 1].push(pos(e)); paint(); }}
        onPointerUp={() => { if (!drawing.current) return; drawing.current = false; emit(); }}
        onPointerCancel={() => { drawing.current = false; emit(); }} />
      {count === 0 && <span className="sd-q-sig-hint" aria-hidden="true">{hint}</span>}
      <div className="sd-q-sig-actions">
        <button type="button" className="sd-q-linkbtn" disabled={!count} onClick={() => { strokes.current.pop(); paint(); emit(); }}>{undoLabel}</button>
        <button type="button" className="sd-q-linkbtn" disabled={!count} onClick={() => { strokes.current = []; paint(); emit(); }}>{clearLabel}</button>
      </div>
    </div>
  );
}
