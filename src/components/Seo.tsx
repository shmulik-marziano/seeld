import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SITE_ORIGIN, resolveRouteMeta, isNoIndex } from "@/lib/seo-meta";

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setRobots(noindex: boolean) {
  const existing = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
  if (noindex) {
    if (existing) existing.setAttribute("content", "noindex, nofollow");
    else upsertMeta("name", "robots", "noindex, nofollow");
  } else if (existing) {
    existing.remove();
  }
}

// The 404 page calls this so soft-404 responses are not indexed.
export function setNoIndex() {
  setRobots(true);
}

// Dynamic pages (blog post, article) call this after their content loads,
// so the tab title and share tags carry the real content title.
export function setDocumentMeta(meta: { title?: string; description?: string }) {
  if (meta.title) {
    document.title = meta.title;
    upsertMeta("property", "og:title", meta.title);
    upsertMeta("name", "twitter:title", meta.title);
  }
  if (meta.description) {
    upsertMeta("name", "description", meta.description);
    upsertMeta("property", "og:description", meta.description);
    upsertMeta("name", "twitter:description", meta.description);
  }
}

// Applies per-route title, description, canonical and share tags on navigation.
// Mounted once inside BrowserRouter.
export default function Seo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const meta = resolveRouteMeta(pathname);
    const clean = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
    const url = clean === "/" ? SITE_ORIGIN : SITE_ORIGIN + clean;

    document.title = meta.title;
    upsertMeta("name", "description", meta.description);
    upsertCanonical(url);
    upsertMeta("property", "og:title", meta.title);
    upsertMeta("property", "og:description", meta.description);
    upsertMeta("property", "og:url", url);
    upsertMeta("name", "twitter:title", meta.title);
    upsertMeta("name", "twitter:description", meta.description);
    setRobots(isNoIndex(pathname));
  }, [pathname]);

  return null;
}
