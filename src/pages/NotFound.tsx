import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { SeeIDLogo } from "@/components/brand/SeeIDLogo";
import { Button } from "@/components/ui/button";
import { Home, ArrowRight } from "lucide-react";

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
        className="text-center space-y-6 px-6"
      >
        <SeeIDLogo size={80} className="mx-auto" />
        <div className="space-y-2">
          <h1 className="text-6xl font-extrabold text-primary">404</h1>
          <p className="text-lg text-muted-foreground">הדף שחיפשת לא נמצא</p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => navigate('/')} className="gap-2">
            <Home className="h-4 w-4" />חזרה לדף הבית
          </Button>
          <Button variant="outline" onClick={() => navigate(-1 as any)} className="gap-2">
            <ArrowRight className="h-4 w-4" />חזרה אחורה
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
