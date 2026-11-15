// JSON-LD builders. The Organization node lives in index.html (so every page, even
// without JavaScript, carries it); everything here references it by @id.
import { faqCategories } from "@/data/faq";

export const SITE_URL = "https://seeld.co.il";
export const ORG_ID = `${SITE_URL}/#organization`;
export const SITE_ID = `${SITE_URL}/#website`;

type Node = Record<string, unknown>;

export const urlFor = (path: string) => `${SITE_URL}${path === "/" ? "/" : path}`;

/** Short label for a page: the part of its title before the first " | ". */
export const labelFromTitle = (title: string) => title.split(" | ")[0].trim();

const PARENTS: Array<[prefix: string, parentPath: string, parentLabel: string]> = [
  ["/insurance/", "/insurances", "כל הביטוחים"],
  ["/savings/", "/savings", "חיסכון והשקעות"],
  ["/return-tables/", "/return-tables", "לוח התשואות"],
  ["/blog/", "/blog", "בלוג"],
];

export function breadcrumb(path: string, label: string): Node | null {
  if (path === "/") return null;
  const items: Array<{ name: string; item: string }> = [{ name: "דף הבית", item: urlFor("/") }];
  const parent = PARENTS.find(([prefix]) => path.startsWith(prefix));
  if (parent) items.push({ name: parent[2], item: urlFor(parent[1]) });
  items.push({ name: label, item: urlFor(path) });
  return {
    "@type": "BreadcrumbList",
    "@id": `${urlFor(path)}#breadcrumb`,
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.item })),
  };
}

const PAGE_TYPE: Record<string, string> = {
  "/about": "AboutPage",
  "/contact": "ContactPage",
  "/faq": "FAQPage",
  "/authors": "ProfilePage",
  "/blog": "CollectionPage",
  "/insurances": "CollectionPage",
  "/savings": "CollectionPage",
  "/calculators": "CollectionPage",
};

export interface PageInfo {
  path: string;
  title: string;
  description: string;
}

export function buildRouteGraph({ path, title, description }: PageInfo): Node {
  const label = labelFromTitle(title);
  const url = urlFor(path);
  const graph: Node[] = [];

  const page: Node = {
    "@type": PAGE_TYPE[path] ?? "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: title,
    description,
    inLanguage: "he-IL",
    isPartOf: { "@id": SITE_ID },
    about: { "@id": ORG_ID },
  };
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

  if (path.startsWith("/insurance/") || path.startsWith("/savings/")) {
    graph.push({
      "@type": "Service",
      "@id": `${url}#service`,
      name: label,
      description,
      url,
      serviceType: path.startsWith("/insurance/") ? "ביטוח" : "חיסכון והשקעות",
      provider: { "@id": ORG_ID },
      areaServed: { "@type": "Country", name: "ישראל" },
      availableChannel: { "@type": "ServiceChannel", serviceUrl: urlFor("/portfolio-review") },
    });
    page.mainEntity = { "@id": `${url}#service` };
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
    page.mainEntity = { "@id": `${url}#dataset` };
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

export interface BlogPostInfo {
  slug: string;
  title: string;
  excerpt?: string | null;
  author?: string | null;
  published_at?: string | null;
  updated_at?: string | null;
  cover_image_url?: string | null;
  category?: string | null;
}

export function buildBlogPostingGraph(post: BlogPostInfo, description: string): Node {
  const url = urlFor(`/blog/${post.slug}`);
  const crumb = breadcrumb(`/blog/${post.slug}`, post.title);
  const posting: Node = {
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    mainEntityOfPage: { "@id": `${url}#webpage` },
    headline: post.title,
    description,
    inLanguage: "he-IL",
    author: post.author ? { "@type": "Person", name: post.author } : { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    isPartOf: { "@id": SITE_ID },
    ...(post.published_at ? { datePublished: post.published_at } : {}),
    ...((post.updated_at ?? post.published_at) ? { dateModified: post.updated_at ?? post.published_at } : {}),
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
        inLanguage: "he-IL",
        isPartOf: { "@id": SITE_ID },
        breadcrumb: { "@id": crumb?.["@id"] },
      },
      posting,
      ...(crumb ? [crumb] : []),
    ],
  };
}
