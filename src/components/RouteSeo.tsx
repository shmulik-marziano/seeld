import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { buildRouteGraph } from "@/lib/structuredData";
import { DEFAULT_TITLE, ROUTE_BY_PATH, SITE_URL, normalizePath } from "@/data/seo/routes";

const DEFAULT_DESCRIPTION = ROUTE_BY_PATH["/"].description;

type RouteMeta = { title: string; description?: string };

// Title and description for every static public route come from the registry
// (src/data/seo/routes.ts). Dynamic routes (/blog/:slug, /article/:id) fall back to the
// prefix rules below until usePageSeo overrides them with the loaded content.
// Private app routes get noindex.
const PREFIX_META: Array<[string, RouteMeta]> = [
  ["/blog/", { title: "בלוג | SEELD" }],
  ["/article/", { title: "מאמר | SEELD" }],
];

// Private/utility areas — excluded from search indexing.
const NOINDEX_PREFIXES = [
  "/app",
  "/admin",
  "/site-admin",
  "/portal/",
  "/execution-portal/",
  "/client/",
  "/style-guide",
  "/personal-area",
  "/saved-calculations",
  "/savings/retirement-planning/checklist",
];

function setMeta(selector: string, attr: "content" | "href", value: string) {
  const el = document.head.querySelector<HTMLElement>(selector);
  if (el) el.setAttribute(attr, value);
}

// Indexable pages explicitly allow full snippets and large previews (what answer engines quote).
const INDEX_DIRECTIVES = "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1";

function setRobots(noindex: boolean) {
  let el = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
  if (!el) {
    el = document.createElement("meta");
    el.name = "robots";
    document.head.appendChild(el);
  }
  el.content = noindex ? "noindex, nofollow" : INDEX_DIRECTIVES;
}

function setAlternates(href: string | null) {
  document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((n) => n.remove());
  if (!href) return;
  for (const lang of ["he-IL", "x-default"]) {
    const el = document.createElement("link");
    el.rel = "alternate";
    el.hreflang = lang;
    el.href = href;
    document.head.appendChild(el);
  }
}

function setJsonLd(graph: object | null) {
  let el = document.head.querySelector<HTMLScriptElement>("script#route-jsonld");
  if (!graph) { el?.remove(); return; }
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = "route-jsonld";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(graph);
}

export default function RouteSeo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const path = normalizePath(pathname);
    const meta: RouteMeta | undefined =
      ROUTE_BY_PATH[path] ??
      PREFIX_META.find(([prefix]) => path.startsWith(prefix))?.[1] ??
      { title: DEFAULT_TITLE };

    const title = meta.title;
    const description = meta.description ?? DEFAULT_DESCRIPTION;
    const canonical = `${SITE_URL}${path === "/" ? "" : path}`;
    const isPost = path.startsWith("/blog/") || path.startsWith("/article/");

    document.title = title;
    setMeta('meta[name="description"]', "content", description);
    setMeta('link[rel="canonical"]', "href", canonical);
    setMeta('meta[property="og:url"]', "content", canonical);
    setMeta('meta[property="og:type"]', "content", isPost ? "article" : "website");
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[name="twitter:title"]', "content", title);
    setMeta('meta[name="twitter:description"]', "content", description);
    const noindex = NOINDEX_PREFIXES.some((p) => path === p || path.startsWith(p.endsWith("/") ? p : p + "/"));
    setRobots(noindex);
    setAlternates(noindex ? null : canonical);
    // Blog posts and articles get their own graph from usePageSeo (needs the loaded data).
    const dynamic = path.startsWith("/blog/") || path.startsWith("/article/");
    if (!dynamic) document.head.querySelector("script#page-jsonld")?.remove();
    setJsonLd(noindex || dynamic ? null : buildRouteGraph({ path, title, description }));
  }, [pathname]);

  return null;
}
