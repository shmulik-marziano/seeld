import { useEffect } from "react";

function set(selector: string, attr: "content" | "href", value: string) {
  const el = document.head.querySelector<HTMLElement>(selector);
  if (el) el.setAttribute(attr, value);
}

/**
 * Overrides the route-level SEO tags with content-specific values once
 * dynamic data (blog post, article) has loaded. RouteSeo handles the
 * generic per-route tags; this hook wins because it runs after data load.
 */
export function usePageSeo(title?: string | null, description?: string | null) {
  useEffect(() => {
    if (!title) return;
    const full = title.includes("SEELD") ? title : `${title} | SEELD`;
    document.title = full;
    set('meta[property="og:title"]', "content", full);
    set('meta[name="twitter:title"]', "content", full);
    if (description) {
      set('meta[name="description"]', "content", description);
      set('meta[property="og:description"]', "content", description);
      set('meta[name="twitter:description"]', "content", description);
    }
  }, [title, description]);
}
