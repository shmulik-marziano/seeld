import { Link, useLocation } from "react-router-dom";
import { labelFromTitle, normalizePath, relatedFor } from "@/data/seo/routes";
import "./RelatedPages.css";

/**
 * Internal-link block driven by the `related` map in src/data/seo/routes.ts (the same map
 * feeds JSON-LD relatedLink and llms-full.txt). Renders nothing for pages without entries.
 * Mounted once, from Footer, so every page that has a footer gets it.
 */
export default function RelatedPages() {
  const { pathname } = useLocation();
  const items = relatedFor(normalizePath(pathname));
  if (!items.length) return null;
  return (
    <nav className="seo-related" dir="rtl" aria-label="עמודים קשורים" data-related-pages>
      <div className="seo-related-wrap">
        <h2 className="seo-related-title">עוד באתר, בהמשך לנושא</h2>
        <ul className="seo-related-list">
          {items.map((e) => (
            <li key={e.path}>
              <Link to={e.path} className="seo-related-link">
                <span className="seo-related-name">{labelFromTitle(e.title)}</span>
                <span className="seo-related-note">{e.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
