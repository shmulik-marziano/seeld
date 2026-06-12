import { useEffect } from "react";

const SITE_NAME = "SEELD";
const DEFAULT_TITLE = "SEELD | בית פיננסים וביטוח עצמאי | מבית עמיתים הון";

/**
 * Sets the document title (and optionally the meta description) for a page.
 * Restores the site-wide defaults on unmount so SPA navigation never leaks
 * a stale title between routes.
 */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;

    let meta: HTMLMetaElement | null = null;
    let previousDescription: string | null = null;
    if (description) {
      meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (meta) {
        previousDescription = meta.getAttribute("content");
        meta.setAttribute("content", description);
      }
    }

    return () => {
      document.title = DEFAULT_TITLE;
      if (meta && previousDescription !== null) {
        meta.setAttribute("content", previousDescription);
      }
    };
  }, [title, description]);
}
