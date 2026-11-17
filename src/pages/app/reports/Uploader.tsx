// Drag-and-drop uploader. Files are read with FileReader/Blob.text() and parsed in memory: nothing leaves the device.
import { useCallback, useId, useRef, useState } from "react";
import { isMacJunk } from "@/reports/parsers/codes";
import type { ParseResult } from "@/reports/parsers/types";

export type UploadKind = "har" | "maslaka";

const ACCEPT: Record<UploadKind, string> = { har: ".xlsx,.xls", maslaka: ".xml,.zip" };
const MAX_BYTES = 25 * 1024 * 1024;

async function readMaslaka(files: File[]): Promise<{ name: string; text: string }[]> {
  const out: { name: string; text: string }[] = [];
  for (const f of files) {
    if (/\.zip$/i.test(f.name)) {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(await f.arrayBuffer());
      for (const entry of Object.values(zip.files)) {
        if (!entry.dir && /\.xml$/i.test(entry.name) && !isMacJunk(entry.name)) out.push({ name: entry.name.split("/").pop() ?? entry.name, text: await entry.async("string") });
      }
    } else if (/\.xml$/i.test(f.name) && !isMacJunk(f.name)) out.push({ name: f.name, text: await f.text() });
  }
  return out;
}

export function Uploader({ kind, onParsed }: { kind: UploadKind; onParsed: (r: ParseResult | null) => void }) {
  const inputId = useId();
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [state, setState] = useState<{ status: "idle" | "busy" | "ok" | "error"; message: string }>({ status: "idle", message: "" });

  const handle = useCallback(async (list: FileList | File[]) => {
    const files = Array.from(list);
    if (!files.length) return;
    if (files.some((f) => f.size > MAX_BYTES)) { setState({ status: "error", message: "הקובץ גדול מהמותר (עד 25MB)." }); onParsed(null); return; }
    setState({ status: "busy", message: "קוראים את הקובץ במכשיר שלכם..." });
    try {
      let res: ParseResult;
      if (kind === "har") {
        const { HarBituachXlsxParser } = await import("@/reports/parsers/harBituach");
        res = await new HarBituachXlsxParser().parse(await files[0].arrayBuffer(), files[0].name);
      } else {
        const inputs = await readMaslaka(files);
        if (!inputs.length) throw new Error("לא נמצא קובץ XML. אפשר להעלות קובצי XML או קובץ ZIP שמכיל אותם.");
        const { MaslakaXmlParser } = await import("@/reports/parsers/maslaka");
        res = new MaslakaXmlParser().parse(inputs);
      }
      if (res.diagnostics.filesSkipped.length && res.products.length === 0) { onParsed(null); setState({ status: "error", message: res.diagnostics.filesSkipped[0].reason }); return; }
      if (res.diagnostics.filesRejected.length && res.products.length === 0) throw new Error(res.diagnostics.filesRejected[0].reason);
      onParsed(res);
      setState({ status: "ok", message: `נקראו ${res.products.length} מוצרים${res.diagnostics.warnings[0] ? `. ${res.diagnostics.warnings[0]}` : ""}` });
    } catch (e) {
      onParsed(null);
      setState({ status: "error", message: e instanceof Error ? e.message : "לא הצלחנו לקרוא את הקובץ." });
    }
  }, [kind, onParsed]);

  return (
    <div>
      <div
        className={`rpx-drop ${over ? "is-over" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); void handle(e.dataTransfer.files); }}
      >
        <img src="/art/icons/document.svg" alt="" width={44} height={44} loading="lazy" />
        <p><b>גוררים לכאן את הקובץ</b> או</p>
        <label htmlFor={inputId} className="rpx-btn">בחירת קובץ</label>
        <input id={inputId} ref={ref} className="sr-only" type="file" accept={ACCEPT[kind]} multiple={kind === "maslaka"} onChange={(e) => { if (e.target.files) void handle(e.target.files); e.target.value = ""; }} />
      </div>
      <p className="rpx-privacy" role="note">העיבוד מתבצע במכשיר שלכם, ושום דבר לא נשלח לשום מקום.</p>
      <p className={`rpx-status is-${state.status}`} role={state.status === "error" ? "alert" : "status"} aria-live="polite">{state.message}</p>
    </div>
  );
}
