import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CARD_SHADOW, LINE } from "@/lib/brand";

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
          <div className="rounded-2xl bg-white border border-[#D9DEE4]" style={{ boxShadow: CARD_SHADOW }}>
            <div className="px-4 pb-3 pt-3 sm:px-5 sm:pb-4 sm:pt-4">
              <p className="hidden sm:block text-[14px] font-bold text-[#203957]">
                עוגיות באתר
              </p>
              <p className="sm:mt-2 text-[14px] sm:text-[15px] leading-snug sm:leading-relaxed text-[#2D435D]">
                אתר זה משתמש בעוגיות הכרחיות לתפקוד תקין ובעוגיות אנליטיות לשיפור השירות.{" "}
                <Link
                  to="/cookie-policy"
                  className="font-medium text-[#203957] underline underline-offset-2 hover:no-underline"
                >
                  מדיניות העוגיות
                </Link>
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 border-t px-3 py-2 sm:px-4 sm:py-3" style={{ borderColor: LINE }}>
              <button
                onClick={decline}
                className="min-h-[44px] rounded-lg px-3 text-[14px] font-bold text-[#55677C] transition-colors duration-150 hover:bg-[#EEF2EC] hover:text-[#203957]"
              >
                הכרחיות בלבד
              </button>
              <button
                onClick={accept}
                className="min-h-[44px] rounded-lg bg-[#203957] px-5 text-[14px] font-bold text-[#FAF7EF] transition-colors duration-150 hover:bg-[#162B45]"
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
