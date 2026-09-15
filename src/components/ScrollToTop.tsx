import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Route change: scroll to the top, unless the new location carries a hash
 * (e.g. "/#portfolio-review" from another page) — then scroll to that element
 * once it exists, honoring the header's scroll-padding.
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

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
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
