import { useEffect } from "react";
import { urlFor, SITE_ID } from "@/lib/structuredData";

/**
 * FAQPage structured data built from the same {q, a} items the page renders,
 * so the schema can never drift from the visible text. Removed on unmount.
 */
export function useFaqJsonLd(items: ReadonlyArray<{ q: string; a: string }>) {
  const key = JSON.stringify(items);
  useEffect(() => {
    const list: Array<{ q: string; a: string }> = JSON.parse(key);
    if (!list.length) return;
    const url = urlFor(window.location.pathname.replace(/\/$/, "") || "/");
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = "page-faq-jsonld";
    el.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      url,
      inLanguage: "he-IL",
      isPartOf: { "@id": SITE_ID },
      mainEntity: list.map((i) => ({
        "@type": "Question",
        name: i.q,
        acceptedAnswer: { "@type": "Answer", text: i.a },
      })),
    });
    document.head.appendChild(el);
    return () => el.remove();
  }, [key]);
}
