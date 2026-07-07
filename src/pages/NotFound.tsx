import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { MONO } from "@/lib/brand";
import { UmbrellaFigure } from "@/components/brand/Figures";

const HEEBO = "'Heebo', sans-serif";

// SEELD Bento: one warm paper tile on the ink gutter (STYLESEED.md + index.css .bento-panel)
const PAPER_MUTED = "#5c5c5c"; // AA-safe caption grey on the warm paper

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col p-2" dir="rtl" style={{ backgroundColor: "#0a0a0a" }}>
      <main className="flex-1 flex">
        <div className="bento-panel flex-1 flex items-center">
          {/* The rotated umbrella — protection, tipped over */}
          <UmbrellaFigure className="absolute -left-8 -top-8 w-44 h-44 sm:w-56 sm:h-56 opacity-50 rotate-[24deg]" />

          <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 w-full py-20">
            <div className="border-t border-[#171717]/20 pt-5">
              <span className="text-[11px] tracking-[0.18em]" style={{ fontFamily: MONO, color: PAPER_MUTED }}>
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
                className="inline-flex items-center justify-center px-9 py-4 bg-[#171717] text-[#e9dfd2] text-base font-medium tracking-wide hover:bg-black transition-colors min-h-[52px] rounded-lg"
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
        </div>
      </main>
    </div>
  );
};

export default NotFound;
