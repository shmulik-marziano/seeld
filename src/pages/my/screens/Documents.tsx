// Documents (spec ס5): the three POA documents signed in the wizard and documents mirrored from the agency system.
// A download asks the server for a short-lived link and opens it in a new tab.
import { useEffect, useRef, useState } from "react";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { CaError, CaLoading } from "@/components/sd/client";
import { MY_COPY as C } from "@/lib/client-area/copy";
import { type ClientApi, type ClientDocument, errorKindOf } from "@/lib/client-area/api";
import { dateHe } from "../parts";

const kb = (n: number | null) => (typeof n === "number" && n > 0 ? `${Math.max(1, Math.round(n / 1024))} KB` : "");

export function Documents({ api, onAuthLost }: { api: ClientApi; onAuthLost: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [docs, setDocs] = useState<ClientDocument[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => { heading.current?.focus(); }, []);
  useEffect(() => {
    let live = true;
    setErr(null);
    api.documents().then((r) => { if (live) setDocs(r.documents); }, (e) => {
      if (!live) return;
      if (errorKindOf(e) === "unauthenticated") onAuthLost(); else setErr(errorKindOf(e) === "unavailable" ? C.errors.unavailable : C.errors.generic);
    });
    return () => { live = false; };
  }, [api, tick, onAuthLost]);

  const open = async (d: ClientDocument) => {
    setOpening(d.id);
    try {
      const url = await api.documentUrl(d.id);
      const w = window.open(url, "_blank", "noopener");
      if (!w) window.location.assign(url);
    } catch (e) {
      if (errorKindOf(e) === "unauthenticated") onAuthLost(); else setErr(C.errors.generic);
    } finally {
      setOpening(null);
    }
  };

  return (
    <div className="ma-stack">
      <div className="ma-greet">
        <h2 ref={heading} tabIndex={-1} className="ma-h1">{C.documents.title}</h2>
        <p className="ma-muted">{C.documents.lead}</p>
      </div>
      {err && <CaError title={err} onRetry={() => setTick((t) => t + 1)} actionLabel={C.errors.retry} />}
      {!err && !docs && <CaLoading label={C.common.loading} tone="sage" />}
      {docs && docs.length === 0 && <p className="sd-my-empty">{C.documents.empty}</p>}
      {docs && docs.length > 0 && (
        <ul className="ma-card ma-rows">
          {docs.map((d) => (
            <li key={d.id} className="ma-doc">
              <span className="ma-doc-ic" aria-hidden="true">PDF</span>
              <span className="ma-doc-txt"><b>{d.title}</b><small>{dateHe(d.created_at)}{kb(d.size_bytes) ? ` · ${kb(d.size_bytes)}` : ""}</small></span>
              {d.downloadable
                ? <button type="button" className="ma-iconbtn" aria-label={`${opening === d.id ? C.documents.opening : C.documents.download} ${d.title}`} disabled={opening === d.id} onClick={() => void open(d)}>
                    <BrandIcon name="download" size={18} />
                  </button>
                : <small className="ma-muted">{C.documents.notDownloadable}</small>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
