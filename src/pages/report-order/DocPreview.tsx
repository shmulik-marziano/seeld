// "צפייה במסמך": opens the PDF the adapter returned (never text rendered in the browser, spec §3) in a new tab.
// An inline <iframe> viewer is not possible under the site CSP (frame-src allows only the Turnstile host), so the
// fallback when the tab is blocked is a plain link to the same blob URL. The URL is revoked on unmount.
import { useEffect, useRef, useState } from "react";
import { POA_COPY as C } from "@/lib/poa/copy";

export function DocPreview({ pdf, describedBy }: { pdf: Blob | null; describedBy?: string }) {
  const url = useRef<{ blob: Blob; href: string } | null>(null);
  const [fallback, setFallback] = useState<string | null>(null);

  useEffect(() => () => { if (url.current) URL.revokeObjectURL(url.current.href); }, []);

  const hrefOf = (blob: Blob) => {
    if (url.current?.blob === blob) return url.current.href;
    if (url.current) URL.revokeObjectURL(url.current.href);
    url.current = { blob, href: URL.createObjectURL(blob) };
    return url.current.href;
  };

  const open = () => {
    if (!pdf) return;
    const href = hrefOf(pdf);
    const w = window.open(href, "_blank");
    if (w) { try { w.opener = null; } catch { /* cross-origin guard */ } setFallback(null); }
    else setFallback(href);
  };

  return (
    <div className="sd-poa-view">
      <button type="button" className="sd-q-btn is-quiet" onClick={open} disabled={!pdf} aria-busy={!pdf || undefined} aria-describedby={describedBy}>
        {pdf ? C.card.view : C.common.loading}
      </button>
      {fallback && <a className="sd-q-linkbtn" href={fallback} target="_blank" rel="noopener noreferrer">{C.card.view}</a>}
    </div>
  );
}
