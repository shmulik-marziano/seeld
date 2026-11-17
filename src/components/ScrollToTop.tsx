import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Route change: scroll to the top, unless the new location carries a hash
 * (e.g. "/#portfolio-review" from another page) — then scroll to that element
 * once it exists, honoring the header's scroll-padding. Keyed on location.key so a click on a link
 * to the SAME route also returns to the top.
 */
const ScrollToTop = () => {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
  }, []);

  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      let tries = 0;
      const tick = () => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ block: "start" });
          return;
        }
        if (tries++ < 20) window.setTimeout(tick, 50);
      };
      tick();
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    // `key` changes on every navigation, including a click on a link to the page you are already on.
  }, [pathname, hash, key]);

  return null;
};

export default ScrollToTop;
