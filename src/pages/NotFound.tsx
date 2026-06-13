import { useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { SeeIDLogo } from "@/components/brand/SeeIDLogo";
import { Home, ArrowRight, Shield, LogIn } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f9fc] relative overflow-hidden" dir="rtl">
      {/* Decorative circles */}
      <div className="absolute top-[15%] left-[10%] w-32 h-32 rounded-full bg-[#5ec6c6] opacity-10" />
      <div className="absolute bottom-[20%] right-[15%] w-24 h-24 rounded-full bg-[#e76f51] opacity-10" />
      <div className="absolute top-[40%] right-[8%] w-16 h-16 rounded-full bg-[#f4a261] opacity-10" />
      <div className="absolute bottom-[10%] left-[20%] w-20 h-20 rounded-full bg-[#6c63ff] opacity-10" />

      {/* Dashed line */}
      <svg className="absolute bottom-0 left-0 w-full h-32 opacity-10 pointer-events-none" viewBox="0 0 800 120" fill="none">
        <path d="M0 100 Q200 30 400 70 T800 40" stroke="#5ec6c6" strokeWidth="2" strokeDasharray="8 6" />
        <polygon points="795,38 800,40 795,42" fill="#5ec6c6" />
      </svg>

      <div className="text-center space-y-8 px-6 max-w-lg relative z-10">
        <SeeIDLogo size={80} showText showSubtitle className="mx-auto" />

        <div className="space-y-3">
          <h1 className="text-7xl font-extrabold text-[#5ec6c6]">404</h1>
          <p className="text-xl font-bold text-[#0a3d3d]">הדף שחיפשת לא נמצא</p>
          <p className="text-sm text-gray-500">
            ייתכן שהכתובת שגויה או שהדף הוסר. נסו לחזור לדף הבית או לבחור מהקישורים הבאים.
          </p>
        </div>

        {/* Primary actions */}
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#5ec6c6] text-white rounded-full font-semibold hover:bg-[#4db5b5] transition-colors"
          >
            <Home className="h-4 w-4" />
            חזרה לדף הבית
          </button>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-[#0a3d3d] text-[#0a3d3d] rounded-full font-semibold hover:bg-[#0a3d3d] hover:text-white transition-colors"
          >
            <ArrowRight className="h-4 w-4" />
            חזרה אחורה
          </button>
        </div>

        {/* Helpful links */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-400 mb-4">קישורים שימושיים</p>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/insurances"
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-gray-100 hover:shadow-md transition-all text-sm font-medium text-[#0a3d3d]"
            >
              <div className="w-7 h-7 rounded-full bg-[#5ec6c6] flex items-center justify-center">
                <Shield className="h-3.5 w-3.5 text-white" />
              </div>
              ביטוחים
            </Link>
            <Link
              to="/savings/pension-funds"
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-gray-100 hover:shadow-md transition-all text-sm font-medium text-[#0a3d3d]"
            >
              <div className="w-7 h-7 rounded-full bg-[#90be6d] flex items-center justify-center">
                <Shield className="h-3.5 w-3.5 text-white" />
              </div>
              חיסכון ופנסיה
            </Link>
            <Link
              to="/calculators"
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-gray-100 hover:shadow-md transition-all text-sm font-medium text-[#0a3d3d]"
            >
              <div className="w-7 h-7 rounded-full bg-[#f4a261] flex items-center justify-center">
                <Shield className="h-3.5 w-3.5 text-white" />
              </div>
              מחשבונים
            </Link>
            <Link
              to="/app/auth"
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-gray-100 hover:shadow-md transition-all text-sm font-medium text-[#0a3d3d]"
            >
              <div className="w-7 h-7 rounded-full bg-[#6c63ff] flex items-center justify-center">
                <LogIn className="h-3.5 w-3.5 text-white" />
              </div>
              כניסה לסוכנים
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
