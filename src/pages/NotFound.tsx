import { useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { SeeIDLogo } from "@/components/brand/SeeIDLogo";
import { Button } from "@/components/ui/button";
import { Home, ArrowRight, Shield, LogIn } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-8 px-6 max-w-lg"
      >
        <SeeIDLogo size={80} showText showSubtitle className="mx-auto" />

        <div className="space-y-3">
          <h1 className="text-7xl font-extrabold text-primary">404</h1>
          <p className="text-xl text-muted-foreground">הדף שחיפשת לא נמצא</p>
          <p className="text-sm text-muted-foreground/60">
            ייתכן שהכתובת שגויה או שהדף הוסר. נסו לחזור לדף הבית או לבחור מהקישורים הבאים.
          </p>
        </div>

        {/* Primary actions */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Button onClick={() => navigate('/')} className="gap-2 rounded-full px-6">
            <Home className="h-4 w-4" />
            חזרה לדף הבית
          </Button>
          <Button variant="outline" onClick={() => navigate(-1 as any)} className="gap-2 rounded-full px-6">
            <ArrowRight className="h-4 w-4" />
            חזרה אחורה
          </Button>
        </div>

        {/* Helpful links */}
        <div className="pt-4 border-t border-border/30">
          <p className="text-xs text-muted-foreground/50 mb-4">קישורים שימושיים</p>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/insurances"
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors text-sm font-medium"
            >
              <Shield className="h-4 w-4 text-primary" />
              ביטוחים
            </Link>
            <Link
              to="/savings/pension-funds"
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors text-sm font-medium"
            >
              <Shield className="h-4 w-4 text-primary" />
              חיסכון ופנסיה
            </Link>
            <Link
              to="/calculators"
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors text-sm font-medium"
            >
              <Shield className="h-4 w-4 text-primary" />
              מחשבונים
            </Link>
            <Link
              to="/app/auth"
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-accent/10 hover:bg-accent/20 transition-colors text-sm font-medium text-accent"
            >
              <LogIn className="h-4 w-4" />
              כניסה לסוכנים
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
