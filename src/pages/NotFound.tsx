import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { DISPLAY, MONO, MUTED, NAVY, PASTEL_BLUE, PASTEL_MINT } from "@/lib/brand";
import { UmbrellaFigure } from "@/components/brand/Figures";

// SEELD DNA v3: white canvas, pastel circles, colossal ghost numeral (STYLESEED.md)

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-white" dir="rtl">
      <main className="flex-1 flex">
        <section className="dna-page flex-1 flex items-center overflow-hidden">
          {/* Pastel circle backdrop — decorative, never behind small text */}
          <div className="dna-circles" aria-hidden="true">
            <div
              className="dna-circ"
              style={{ width: 300, height: 300, top: -120, right: -90, backgroundColor: PASTEL_BLUE, opacity: 0.55 }}
            />
            <div
              className="dna-circ"
              style={{ width: 220, height: 220, bottom: -110, left: "22%", backgroundColor: PASTEL_MINT, opacity: 0.45 }}
            />
          </div>

          {/* The rotated umbrella — protection, tipped over (navy line-art) */}
          <UmbrellaFigure className="absolute left-2 top-6 w-40 h-40 sm:w-52 sm:h-52 opacity-40 rotate-[24deg] pointer-events-none" />

          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 w-full py-20">
            {/* The colossal 404 — Frank Ruhl 900, navy ghost */}
            <div
              className="leading-none select-none tabular-nums"
              dir="ltr"
              aria-hidden="true"
              style={{
                fontFamily: DISPLAY,
                fontWeight: 900,
                color: NAVY,
                opacity: 0.06,
                fontSize: "clamp(7rem, 24vw, 18rem)",
                letterSpacing: "-0.04em",
                textAlign: "right",
              }}
            >
              404
            </div>

            <h1
              className="mt-8 text-xl sm:text-2xl max-w-xl leading-[1.5]"
              style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}
            >
              העמוד הזה לא קיים. רוב הדברים החשובים אצלנו דווקא מכוסים.
            </h1>

            <p
              className="mt-3 text-[11px] tracking-[0.18em]"
              style={{ fontFamily: MONO, color: MUTED }}
              dir="ltr"
            >
              ERROR · PAGE NOT FOUND
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-6">
              <Link
                to="/"
                className="inline-flex items-center justify-center px-9 py-4 bg-[#1D2D3D] text-white text-base font-medium tracking-wide hover:bg-[#16222f] transition-colors min-h-[52px] rounded-lg"
              >
                לדף הבית
              </Link>
              <Link
                to="/contact"
                className="group inline-flex items-center gap-2 text-base font-medium text-[#1D2D3D] border-b border-[#1D2D3D]/25 pb-0.5 hover:border-[#1D2D3D] transition-colors"
              >
                דברו איתנו
                <span className="inline-block transition-transform group-hover:-translate-x-1" aria-hidden="true">←</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* The signature gradient bar — bottom of every page */}
      <div className="dna-gbar" />
    </div>
  );
};

export default NotFound;
