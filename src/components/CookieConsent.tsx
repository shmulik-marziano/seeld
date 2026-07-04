import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MONO, CARD_SHADOW, FAINT, LINE } from "@/lib/brand";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

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
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-50"
          role="region"
          aria-label="הסכמה לשימוש בעוגיות"
        >
          <div className="rounded-lg bg-white" style={{ boxShadow: CARD_SHADOW }}>
            <div className="px-5 pb-4 pt-4">
              <p
                className="text-[11px] font-medium tracking-[0.12em]"
                style={{ fontFamily: MONO, color: FAINT }}
                dir="ltr"
              >
                COOKIES
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-[#4d4d4d]">
                אתר זה משתמש בעוגיות הכרחיות לתפקוד תקין ובעוגיות אנליטיות לשיפור השירות.{" "}
                <Link
                  to="/cookie-policy"
                  className="font-medium text-[#171717] underline underline-offset-2 hover:no-underline"
                >
                  למידע נוסף
                </Link>
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 border-t px-4 py-3" style={{ borderColor: LINE }}>
              <button
                onClick={decline}
                className="min-h-[36px] rounded-md px-3 text-[13px] font-medium text-[#5c5c5c] transition-colors duration-150 hover:bg-[#f5f5f5] hover:text-[#171717]"
              >
                הכרחיות בלבד
              </button>
              <button
                onClick={accept}
                className="min-h-[36px] rounded-md bg-[#171717] px-5 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-[#262626]"
              >
                אישור
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
