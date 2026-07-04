import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { MONO, FAINT } from "@/lib/brand";

const HEEBO = "'Heebo', sans-serif";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-white flex flex-col" dir="rtl">
      <main className="flex-1 flex items-center">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 w-full py-20">
          <div className="border-t border-[#171717]/20 pt-5">
            <span className="text-[11px] tracking-[0.18em]" style={{ fontFamily: MONO, color: FAINT }}>
              ERROR · PAGE NOT FOUND
            </span>
          </div>

          <div
            className="mt-6 text-[#171717] tabular-nums leading-none select-none"
            dir="ltr"
            style={{
              fontFamily: MONO,
              fontWeight: 600,
              fontSize: "clamp(7rem, 24vw, 18rem)",
              letterSpacing: "-0.04em",
              textAlign: "right",
            }}
          >
            404
          </div>

          <p
            className="mt-8 text-xl sm:text-2xl text-[#171717] max-w-xl leading-[1.5]"
            style={{ fontFamily: HEEBO, fontWeight: 600 }}
          >
            העמוד הזה לא קיים. רוב הדברים החשובים אצלנו דווקא מכוסים.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-6">
            <Link
              to="/"
              className="inline-flex items-center justify-center px-9 py-4 bg-[#171717] text-[#fafafa] text-base font-medium tracking-wide hover:bg-[#262626] transition-colors min-h-[52px]"
            >
              לדף הבית
            </Link>
            <Link
              to="/contact"
              className="group inline-flex items-center gap-2 text-base font-medium text-[#171717] border-b border-[#171717]/25 pb-0.5 hover:border-[#171717] transition-colors"
            >
              דברו איתנו
              <span className="inline-block transition-transform group-hover:-translate-x-1" aria-hidden="true">←</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
