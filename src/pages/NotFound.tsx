import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Illustration } from "@/components/brand/Illustration";
import { BrandDots } from "@/components/brand/Elements";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { GREEN, IVORY, MUTED, PASTEL_SAGE } from "@/lib/brand";

// 404: a small journey illustration and the way home. No ghost numerals.

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col" dir="rtl" style={{ backgroundColor: IVORY }}>
      <Header />

      <main className="flex-1 flex">
        <section className="dna-page flex-1 flex items-center overflow-hidden">
          <div className="dna-circles" aria-hidden="true">
            <div
              className="dna-circ hidden md:block"
              style={{ width: 300, height: 300, top: -140, left: -110, backgroundColor: PASTEL_SAGE, opacity: 0.8 }}
            />
          </div>

          <div className="relative z-10 max-w-brand mx-auto px-5 sm:px-8 w-full py-16 sm:py-24">
            <div className="grid gap-10 lg:gap-16 lg:grid-cols-[1.1fr_0.9fr] items-center">
              <div>
                <BrandDots className="mb-5" />
                <p className="text-[15px] font-bold mb-3" style={{ color: MUTED }}>
                  שגיאה <span dir="ltr" className="tabular-nums">404</span>
                </p>
                <h1 className="dna-display leading-[1.15] max-w-xl" style={{ fontSize: "clamp(30px, 4vw, 44px)" }}>
                  העמוד הזה לא קיים. רוב הדברים החשובים אצלנו דווקא מכוסים.
                </h1>
                <p className="mt-5 text-[17px] leading-[1.7] max-w-lg" style={{ color: MUTED }}>
                  ייתכן שהקישור השתנה או שהכתובת הוקלדה בטעות. השביל הביתה קצר.
                </p>
                <div className="mt-9 flex flex-col sm:flex-row gap-3">
                  <Link to="/" className="btn-primary sm:min-w-[200px]">לדף הבית</Link>
                  <Link to="/contact" className="btn-secondary sm:min-w-[200px]">דברו איתנו</Link>
                </div>
                <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[15px]">
                  <Link to="/insurances" className="link-rule">ביטוח <BrandIcon name="arrow-left" size={16} /></Link>
                  <Link to="/savings" className="link-rule">חיסכון ופנסיה <BrandIcon name="arrow-left" size={16} /></Link>
                  <Link to="/calculators" className="link-rule">מחשבונים <BrandIcon name="arrow-left" size={16} /></Link>
                  <Link to="/learn" className="link-rule">מידע ולמידה <BrandIcon name="arrow-left" size={16} /></Link>
                </div>
              </div>

              <Illustration
                name="01-journey"
                priority
                sizes="(min-width: 1024px) 480px, 100vw"
                className="max-w-md mx-auto lg:max-w-none"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <span className="sr-only" style={{ color: GREEN }} aria-hidden="true" />
    </div>
  );
};

export default NotFound;
