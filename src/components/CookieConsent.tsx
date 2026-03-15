import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie } from "lucide-react";

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
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-50"
        >
          <div className="bg-card border border-border rounded-2xl p-5 shadow-xl backdrop-blur-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Cookie className="w-4 h-4 text-accent" />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1">שימוש בעוגיות</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  אתר זה משתמש בעוגיות הכרחיות לתפקוד תקין ובעוגיות אנליטיות לשיפור השירות.{" "}
                  <Link to="/cookie-policy" className="text-accent hover:underline">
                    למידע נוסף
                  </Link>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={decline}
                className="rounded-full text-xs px-4"
              >
                הכרחיות בלבד
              </Button>
              <Button
                size="sm"
                onClick={accept}
                className="rounded-full text-xs px-6 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                אישור
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
