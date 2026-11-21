// JSON-LD builders. One consistent @id graph per page:
//   https://seeld.co.il/#organization   InsuranceAgency + FinancialService (lives in index.html,
//                                       so every page, even without JavaScript, carries it)
//   https://seeld.co.il/#website        WebSite (index.html)
//   <url>#webpage                       WebPage / CollectionPage / FAQPage / ... (this file)
//   <url>#breadcrumb                    BreadcrumbList
//   <url>#service                       Service (insurance, savings, portfolio review, rights check)
//   <url>#faq                           FAQPage from the visible FAQ items (useFaqJsonLd)
//   <url>#article                       BlogPosting / Article (knowledge guides: kind "article")
//   <url>#glossary                      DefinedTermSet (/learn, from src/data/glossary.ts)
// Everything here references the Organization and WebSite by @id. No personal names anywhere:
// content is authored by the agency (the Organization), never by an individual.
import { faqCategories } from "@/data/faq";
import { answerSummaries, ANSWER_REVIEWED } from "@/data/answerSummaries";
import { GLOSSARY_TERMS } from "@/data/glossary";
import {
  CONTENT_REVIEWED, ROUTE_BY_PATH, SITE_URL, labelFromTitle, relatedFor, urlFor,
  type RouteEntry,
} from "@/data/seo/routes";

export { SITE_URL, labelFromTitle, urlFor };
export const ORG_ID = `${SITE_URL}/#organization`;
export const SITE_ID = `${SITE_URL}/#website`;

type Node = Record<string, unknown>;

/** Breadcrumb trail for a path: home > [parent] > page. */
function trail(path: string, label: string): Array<{ name: string; path: string }> {
  const items: Array<{ name: string; path: string }> = [{ name: "דף הבית", path: "/" }];
  const entry = ROUTE_BY_PATH[path];
  let parentPath = entry?.parent;
  if (!parentPath && path.startsWith("/blog/")) parentPath = "/blog";
  const parent = parentPath ? ROUTE_BY_PATH[parentPath] : undefined;
  if (parent) items.push({ name: labelFromTitle(parent.title), path: parent.path });
  items.push({ name: label, path });
  return items;
}

export function breadcrumb(path: string, label: string): Node | null {
  if (path === "/") return null;
  return {
    "@type": "BreadcrumbList",
    "@id": `${urlFor(path)}#breadcrumb`,
    itemListElement: trail(path, label).map((it, i) => ({
      "@type": "ListItem", position: i + 1, name: it.name, item: urlFor(it.path),
    })),
  };
}

export interface PageInfo {
  path: string;
  title: string;
  description: string;
}

const SERVICE_KINDS = new Set(["insurance", "savings", "service"]);
const HUB_LISTS: Record<string, (e: RouteEntry) => boolean> = {
  "/insurances": (e) => e.kind === "insurance",
  "/savings": (e) => e.kind === "savings",
  "/return-tables": (e) => e.path.startsWith("/return-tables/"),
  "/learn/guides": (e) => e.kind === "article" && e.path.startsWith("/learn/guides/"),
  "/learn/pension-tax": (e) => e.path.startsWith("/learn/pension-tax/"),
};

const itemList = (id: string, entries: RouteEntry[]): Node => ({
  "@type": "ItemList",
  "@id": id,
  numberOfItems: entries.length,
  itemListElement: entries.map((e, i) => ({
    "@type": "ListItem", position: i + 1, name: labelFromTitle(e.title), url: urlFor(e.path),
  })),
});

export function buildRouteGraph({ path, title, description }: PageInfo): Node {
  const entry = ROUTE_BY_PATH[path];
  const label = labelFromTitle(title);
  const url = urlFor(path);
  const summary = answerSummaries[path];
  const graph: Node[] = [];

  const page: Node = {
    "@type": entry?.pageType ?? "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: title,
    description,
    inLanguage: "he-IL",
    isPartOf: { "@id": SITE_ID },
    about: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    dateModified: CONTENT_REVIEWED,
  };
  if (summary) page.abstract = summary;
  // Visible answer paragraph exists only on product pages (AnswerSummary component).
  if (entry && (entry.kind === "insurance" || entry.kind === "savings")) {
    page.speakable = { "@type": "SpeakableSpecification", cssSelector: ["h1", "[data-answer-summary]"] };
    if (summary) page.lastReviewed = ANSWER_REVIEWED;
  }
  const related = relatedFor(path);
  if (related.length) page.relatedLink = related.map((e) => urlFor(e.path));

  const crumb = breadcrumb(path, label);
  if (crumb) page.breadcrumb = { "@id": crumb["@id"] };
  graph.push(page);
  if (crumb) graph.push(crumb);

  if (path === "/faq") {
    page.mainEntity = faqCategories.flatMap((c) => c.questions).map((q) => ({
      "@type": "Question",
      name: q.q,
      acceptedAnswer: { "@type": "Answer", text: q.a },
    }));
  }

  if (entry && SERVICE_KINDS.has(entry.kind)) {
    graph.push({
      "@type": "Service",
      "@id": `${url}#service`,
      name: label,
      description: summary ?? description,
      url,
      serviceType: entry.kind === "insurance" ? "ביטוח" : entry.kind === "savings" ? "חיסכון והשקעות" : "ייעוץ פיננסי וביטוחי",
      provider: { "@id": ORG_ID },
      areaServed: { "@type": "Country", name: "ישראל" },
      availableChannel: { "@type": "ServiceChannel", serviceUrl: urlFor("/portfolio-review") },
    });
    page.mainEntity = { "@id": `${url}#service` };
  }

  // Knowledge guides: the page is about one Article node (same @id family, all references resolve).
  if (entry?.kind === "article") {
    graph.push({
      "@type": "Article",
      "@id": `${url}#article`,
      mainEntityOfPage: { "@id": `${url}#webpage` },
      headline: label,
      description,
      ...(summary ? { abstract: summary } : {}),
      inLanguage: "he-IL",
      author: { "@id": ORG_ID },
      publisher: { "@id": ORG_ID },
      isPartOf: { "@id": SITE_ID },
      dateModified: CONTENT_REVIEWED,
    });
    page.mainEntity = { "@id": `${url}#article` };
  }

  const hub = HUB_LISTS[path];
  if (hub) {
    const children = Object.values(ROUTE_BY_PATH).filter(hub);
    if (children.length) {
      graph.push(itemList(`${url}#list`, children));
      page.mainEntity = { "@id": `${url}#list` };
    }
  }

  if (path === "/") {
    const top = ["/insurances", "/savings", "/portfolio-review", "/rights-extraction", "/return-tables", "/calculators"]
      .map((p) => ROUTE_BY_PATH[p]).filter(Boolean);
    graph.push(itemList(`${url}#services`, top));
    page.mainEntity = { "@id": ORG_ID };
  }

  if (path === "/learn" && GLOSSARY_TERMS.length) {
    graph.push({
      "@type": "DefinedTermSet",
      "@id": `${url}#glossary`,
      name: "מונחון שילד",
      inLanguage: "he-IL",
      url,
      hasDefinedTerm: GLOSSARY_TERMS.map((g) => ({
        "@type": "DefinedTerm",
        name: g.term,
        description: g.body,
        inDefinedTermSet: { "@id": `${url}#glossary` },
      })),
    });
    page.about = [{ "@id": ORG_ID }, { "@id": `${url}#glossary` }];
  }

  if (path === "/calculators") {
    graph.push({
      "@type": "WebApplication",
      "@id": `${url}#app`,
      name: "מחשבונים פיננסיים של שילד",
      url,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      inLanguage: "he-IL",
      isAccessibleForFree: true,
      provider: { "@id": ORG_ID },
    });
  }

  if (path === "/return-tables" || path.startsWith("/return-tables/")) {
    graph.push({
      "@type": "Dataset",
      "@id": `${url}#dataset`,
      name: label,
      description,
      url,
      inLanguage: "he-IL",
      isAccessibleForFree: true,
      creator: { "@id": ORG_ID },
      publisher: { "@id": ORG_ID },
      isBasedOn: { "@type": "Organization", name: "רשות שוק ההון, ביטוח וחיסכון" },
      measurementTechnique: "אגרגציה של דיווחים רשמיים לפי מסלול השקעה, מתעדכן אוטומטית",
    });
    if (!page.mainEntity) page.mainEntity = { "@id": `${url}#dataset` };
    else page.about = [{ "@id": ORG_ID }, { "@id": `${url}#dataset` }];
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

export interface BlogPostInfo {
  slug: string;
  title: string;
  excerpt?: string | null;
  /** Ignored on purpose: posts are published by the agency, never under a personal name. */
  author?: string | null;
  published_at?: string | null;
  updated_at?: string | null;
  cover_image_url?: string | null;
  category?: string | null;
}

export function buildBlogPostingGraph(post: BlogPostInfo, description: string): Node {
  const url = urlFor(`/blog/${post.slug}`);
  const crumb = breadcrumb(`/blog/${post.slug}`, post.title);
  const modified = post.updated_at ?? post.published_at;
  const posting: Node = {
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    mainEntityOfPage: { "@id": `${url}#webpage` },
    headline: post.title,
    description,
    abstract: description,
    inLanguage: "he-IL",
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    isPartOf: { "@id": SITE_ID },
    ...(post.published_at ? { datePublished: post.published_at } : {}),
    ...(modified ? { dateModified: modified } : {}),
    ...(post.cover_image_url ? { image: post.cover_image_url } : {}),
    ...(post.category ? { articleSection: post.category } : {}),
  };
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: post.title,
        description,
        abstract: description,
        inLanguage: "he-IL",
        isPartOf: { "@id": SITE_ID },
        publisher: { "@id": ORG_ID },
        ...(crumb ? { breadcrumb: { "@id": crumb["@id"] } } : {}),
        relatedLink: relatedFor(`/blog/${post.slug}`).map((e) => urlFor(e.path)),
      },
      posting,
      ...(crumb ? [crumb] : []),
    ],
  };
}

/** Static articles (/article/:id): same shape as a blog post, authored by the agency. */
export function buildArticleGraph(id: string, title: string, subtitle: string): Node {
  const url = urlFor(`/article/${id}`);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage", "@id": `${url}#webpage`, url, name: title, description: subtitle,
        abstract: subtitle, inLanguage: "he-IL", isPartOf: { "@id": SITE_ID }, publisher: { "@id": ORG_ID },
      },
      {
        "@type": "Article", "@id": `${url}#article`, mainEntityOfPage: { "@id": `${url}#webpage` },
        headline: title, description: subtitle, inLanguage: "he-IL",
        author: { "@id": ORG_ID }, publisher: { "@id": ORG_ID }, isPartOf: { "@id": SITE_ID },
      },
    ],
  };
}
