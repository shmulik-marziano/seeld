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
          <div className="rounded-2xl bg-white border border-[#CCD6CC]" style={{ boxShadow: CARD_SHADOW }}>
            <div className="px-5 pb-4 pt-4">
              <p className="text-[14px] font-bold text-[#003D30]">
                עוגיות באתר
              </p>
              <p className="mt-2 text-[15px] leading-relaxed text-[#24483C]">
                אתר זה משתמש בעוגיות הכרחיות לתפקוד תקין ובעוגיות אנליטיות לשיפור השירות.{" "}
                <Link
                  to="/cookie-policy"
                  className="font-medium text-[#003D30] underline underline-offset-2 hover:no-underline"
                >
                  מדיניות העוגיות
                </Link>
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 border-t px-4 py-3" style={{ borderColor: LINE }}>
              <button
                onClick={decline}
                className="min-h-[40px] rounded-lg px-3 text-[14px] font-bold text-[#476356] transition-colors duration-150 hover:bg-[#EEF2EC] hover:text-[#003D30]"
              >
                הכרחיות בלבד
              </button>
              <button
                onClick={accept}
                className="min-h-[40px] rounded-lg bg-[#003D30] px-5 text-[14px] font-bold text-[#FAF7EF] transition-colors duration-150 hover:bg-[#002B22]"
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
