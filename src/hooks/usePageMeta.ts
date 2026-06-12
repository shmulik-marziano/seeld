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
    const ownTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
    document.title = ownTitle;

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
      // During animated page transitions the entering page may mount before
      // this page unmounts — only reset values this instance still owns.
      if (document.title === ownTitle) {
        document.title = DEFAULT_TITLE;
      }
      if (meta && previousDescription !== null && meta.getAttribute("content") === description) {
        meta.setAttribute("content", previousDescription);
      }
    };
  }, [title, description]);
}
