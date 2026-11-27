// Har HaBituach card (spec ס7): only while the server switch is on (GET /harb). How to download the export in three short
// lines, a link to the registry, one button that picks the .xlsx and sends it. The server checks the file (column A must
// be the signed-in client's national id) and answers a reason code on a refusal; the card shows one plain line for it.
import { useEffect, useRef, useState } from "react";
import { MY_COPY as C } from "@/lib/client-area/copy";
import { HARB_SITE_URL } from "@/lib/client-area/config";
import { type ClientApi, ClientApiError, errorKindOf, HARB_MAX_BYTES, type HarbStatusRes } from "@/lib/client-area/api";
import { dateHe } from "../parts";

const ACCEPT = ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function readFileBytes(file: Blob): Promise<Uint8Array> {
  if (typeof file.arrayBuffer === "function") return file.arrayBuffer().then((b) => new Uint8Array(b));
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(new Uint8Array(r.result as ArrayBuffer));
    r.onerror = () => reject(r.error);
    r.readAsArrayBuffer(file);
  });
}

export function HarbCard({ api, onAuthLost }: { api: ClientApi; onAuthLost: () => void }) {
  const [status, setStatus] = useState<HarbStatusRes | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let live = true;
    api.harbStatus().then((s) => { if (live) setStatus(s); }, (e) => {
      // any other failure keeps the card hidden: it is an extra, never a blocker of the home screen
      if (live && errorKindOf(e) === "unauthenticated") onAuthLost();
    });
    return () => { live = false; };
  }, [api, onAuthLost]);

  if (!status?.enabled) return null;

  const pick = async (file?: File) => {
    if (!file) return;
    setMsg(null);
    if (file.size > HARB_MAX_BYTES) {
      setMsg({ tone: "err", text: C.harb.reasons.too_large });
      if (input.current) input.current.value = "";
      return;
    }
    setBusy(true);
    try {
      const r = await api.harbUpload(await readFileBytes(file));
      setMsg({ tone: "ok", text: r.duplicate ? C.harb.duplicate : C.harb.received });
      if (!r.duplicate) setStatus((s) => (s ? { ...s, last_upload: { created_at: new Date().toISOString(), processed: false } } : s));
    } catch (e) {
      const k = errorKindOf(e);
      if (k === "unauthenticated") { onAuthLost(); return; }
      const reason = e instanceof ClientApiError ? e.reason : undefined;
      setMsg({ tone: "err", text: k === "harb_invalid" ? C.harb.reasons[reason ?? "bad_file"] : k === "inactive" ? C.harb.closed : C.errors.unavailable });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const last = status.last_upload;
  return (
    <section className="ma-card" aria-labelledby="my-harb-h">
      <h3 id="my-harb-h" className="ma-h2">{C.harb.title}</h3>
      <p className="ma-muted">{C.harb.lead}</p>
      <h4 className="ma-h3">{C.harb.stepsTitle}</h4>
      <ol className="sd-my-steps">
        {C.harb.steps.map((s) => <li key={s}>{s}</li>)}
      </ol>
      <p className="sd-my-join"><a href={HARB_SITE_URL} target="_blank" rel="noopener noreferrer">{C.harb.siteLink}</a></p>
      {last?.created_at && (
        <p className="sd-my-asof">{C.harb.last(dateHe(last.created_at))}{last.processed ? ` ${C.harb.processed}` : ""}</p>
      )}
      <div className="sd-my-actions">
        <input
          ref={input} id="my-harb-file" className="sd-my-file" type="file" accept={ACCEPT} disabled={busy}
          onChange={(e) => void pick(e.target.files?.[0])}
        />
        <label htmlFor="my-harb-file" className="ma-btn" aria-disabled={busy || undefined} aria-live="polite">{busy ? C.harb.sending : C.harb.cta}</label>
      </div>
      {msg && <p className={msg.tone === "err" ? "sd-q-error" : "sd-q-fine"} role={msg.tone === "err" ? "alert" : "status"}>{msg.text}</p>}
      <p className="ma-fine">{C.harb.privacy}</p>
    </section>
  );
}
