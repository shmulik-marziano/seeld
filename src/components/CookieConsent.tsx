import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "@/components/sd/chrome.css";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // While the banner is up, lift the floating launchers above it (see chrome.css)
  useEffect(() => {
    const root = document.documentElement;
    if (!visible) { root.style.removeProperty("--sd-cookie-lift"); return; }
    const el = boxRef.current;
    if (!el) return;
    const apply = () => root.style.setProperty("--sd-cookie-lift", `${el.offsetHeight + 12}px`);
    apply();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(apply) : null;
    ro?.observe(el);
    return () => { ro?.disconnect(); root.style.removeProperty("--sd-cookie-lift"); };
  }, [visible]);

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 12, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          ref={boxRef}
          className="sd-chrome-cookie"
          role="region"
          aria-label="הסכמה לשימוש בעוגיות"
        >
          <p className="sd-chrome-cookie-text">
            אתר זה משתמש בעוגיות הכרחיות לתפקוד תקין ובעוגיות אנליטיות לשיפור השירות.{" "}
            <Link to="/cookie-policy">מדיניות העוגיות</Link>
          </p>
          <div className="sd-chrome-cookie-btns">
            <button onClick={decline} className="sd-chrome-cookie-ghost">הכרחיות בלבד</button>
            <button onClick={accept} className="sd-chrome-cookie-ok">אישור</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
