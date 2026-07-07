import { useEffect, useState } from "react";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import AuthModal from "@/components/AuthModal";
import { DISPLAY, LINE, MONO, MUTED, NAVY, PASTEL_BLUE, PASTEL_MINT, TINT_GOLD, TURQ_TEXT } from "@/lib/brand";

// SEELD DNA v3 (STYLESEED.md): white canvas, pastel circles, hairline ruled list.

type SavedCalculation = {
  id: string;
  calculator_type: string;
  title: string;
  input_data: Record<string, unknown>;
  result_data: Record<string, unknown>;
  tips: string[];
  created_at: string;
};

const calculatorTypeLabels: Record<string, string> = {
  mortgage: "משכנתא",
  pension: "פנסיה",
  savings: "חיסכון",
  goal: "יעד פיננסי",
  compare: "השוואת מסלולים",
  "income-tax": "מס הכנסה",
  "life-insurance": "ביטוח חיים",
  "car-insurance": "ביטוח רכב",
};

const monoNum: React.CSSProperties = { fontFamily: MONO, fontVariantNumeric: "tabular-nums" };

const SavedCalculations = () => {
  const [calculations, setCalculations] = useState<SavedCalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      setShowAuthModal(true);
      setLoading(false);
    } else if (user) {
      fetchCalculations();
    }
  }, [user, authLoading]);

  const fetchCalculations = async () => {
    try {
      const { data, error } = await supabase
        .from("saved_calculations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCalculations(data as SavedCalculation[]);
    } catch (error) {
      toast({
        title: "החישובים לא נטענו. רעננו את העמוד ונסו שוב.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteCalculation = async (id: string) => {
    try {
      const { error } = await supabase
        .from("saved_calculations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setCalculations((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "החישוב נמחק" });
    } catch (error) {
      toast({
        title: "המחיקה לא הושלמה. נסו שוב.",
        variant: "destructive",
      });
    }
  };

  // Ledger-style mono timestamp: 07.07.2026 · 14:32
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const formatResultSummary = (calc: SavedCalculation) => {
    const result = calc.result_data;
    const money = (v: unknown) => (
      <span dir="ltr" style={monoNum}>{`₪${(v as number)?.toLocaleString()}`}</span>
    );
    switch (calc.calculator_type) {
      case "mortgage":
        return <>תשלום חודשי: {money(result.monthlyPayment)}</>;
      case "pension":
        return <>פנסיה צפויה: {money(result.monthlyPension)}</>;
      case "savings":
        return <>סכום סופי: {money(result.finalAmount)}</>;
      case "goal":
        return <>הפקדה נדרשת: {money(result.monthlyRequired)}</>;
      case "compare":
        return <>מסלול מומלץ: {String(result.recommended || "לא נבחר")}</>;
      case "income-tax":
        return <>מס חודשי: {money(result.monthlyTax)}</>;
      case "life-insurance":
        return <>כיסוי מומלץ: {money(result.recommendedCover)}</>;
      case "car-insurance":
        return (
          <>
            טווח שנתי משוער:{" "}
            <span dir="ltr" style={monoNum}>
              {`₪${(result.annualLow as number)?.toLocaleString()}–₪${(result.annualHigh as number)?.toLocaleString()}`}
            </span>
          </>
        );
      default:
        return null;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex flex-col items-center justify-center gap-4 h-[60vh]" dir="rtl">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: NAVY }} />
          <p className="text-[14px]" style={{ color: MUTED }}>טוען את החישובים השמורים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      <main className="dna-page">
        {/* Pastel circle backdrop — decorative, never behind small text */}
        <div className="dna-circles" aria-hidden="true">
          <div
            className="dna-circ"
            style={{ width: 260, height: 260, top: -110, left: -100, backgroundColor: PASTEL_BLUE, opacity: 0.5 }}
          />
          <div
            className="dna-circ hidden md:block"
            style={{ width: 220, height: 220, bottom: -120, right: -90, backgroundColor: PASTEL_MINT, opacity: 0.45 }}
          />
        </div>

        <div className="relative z-10">
          {/* Hero */}
          <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-10 sm:pb-14">
            <nav className="flex items-center gap-2 text-[13px] mb-8" style={{ color: MUTED }}>
              <Link to="/" className="hover:text-[#1D2D3D] transition-colors">דף הבית</Link>
              <span aria-hidden="true">←</span>
              <Link to="/calculators" className="hover:text-[#1D2D3D] transition-colors">מחשבונים</Link>
              <span aria-hidden="true">←</span>
              <span className="font-medium text-[#1D2D3D]">החישובים שלי</span>
            </nav>

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
              <div>
                <h1
                  className="dna-display leading-[1.15] mb-4"
                  style={{ fontSize: "clamp(2rem, 5vw, 3.1rem)" }}
                >
                  החישובים שלי
                </h1>
                <p className="text-base sm:text-[17px] leading-[1.9]" style={{ color: MUTED }}>
                  כל החישובים ששמרתם מהמחשבונים, במקום אחד.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/calculators")}
                className="shrink-0 inline-flex items-center justify-center px-7 py-3.5 rounded-lg bg-[#1D2D3D] text-white text-base font-medium tracking-wide hover:bg-[#16222f] transition-colors min-h-[48px]"
              >
                למחשבונים
              </button>
            </div>
          </section>

          <section className="border-t" style={{ borderColor: LINE }}>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
              {!user ? (
                /* Not signed in */
                <div>
                  <h2
                    className="dna-display leading-tight mb-3"
                    style={{ fontSize: "clamp(1.4rem, 2.6vw, 1.8rem)" }}
                  >
                    נדרשת התחברות
                  </h2>
                  <p className="text-base leading-[1.85] max-w-xl mb-7" style={{ color: "#3a4c5a" }}>
                    החישובים השמורים מקושרים לחשבון שלכם. התחברו כדי לראות אותם,
                    או פתחו מחשבון וחשבו בלי רישום.
                  </p>
                  <div className="flex flex-wrap items-center gap-6">
                    <button
                      type="button"
                      onClick={() => setShowAuthModal(true)}
                      className="inline-flex items-center justify-center px-9 py-4 rounded-lg bg-[#1D2D3D] text-white text-base font-medium tracking-wide hover:bg-[#16222f] transition-colors min-h-[52px]"
                    >
                      התחברות
                    </button>
                    <Link
                      to="/calculators"
                      className="group inline-flex items-center gap-2 text-base font-medium text-[#1D2D3D] border-b border-[#1D2D3D]/25 pb-0.5 hover:border-[#1D2D3D] transition-colors"
                    >
                      למחשבונים בלי רישום
                      <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
                    </Link>
                  </div>
                </div>
              ) : calculations.length === 0 ? (
                /* Empty state — gold-tint tile CTA to /calculators */
                <div>
                  <h2
                    className="dna-display leading-tight mb-3"
                    style={{ fontSize: "clamp(1.4rem, 2.6vw, 1.8rem)" }}
                  >
                    אין חישובים שמורים עדיין
                  </h2>
                  <p className="text-base leading-[1.85] max-w-xl mb-7" style={{ color: "#3a4c5a" }}>
                    פתחו מחשבון משכנתא, פנסיה או חיסכון, ושמרו את התוצאה.
                    היא תופיע כאן ותוכלו לחזור אליה מכל מכשיר.
                  </p>
                  <Link
                    to="/calculators"
                    className="dna-hover inline-flex flex-col items-start gap-1.5 px-7 py-5 rounded-xl border"
                    style={{ backgroundColor: TINT_GOLD, borderColor: "#E1EAF1" }}
                  >
                    <span className="text-[15px] font-semibold" style={{ color: NAVY }}>פתיחת מחשבון ←</span>
                    <span
                      className="text-[10px] tracking-[0.2em] font-semibold"
                      style={{ fontFamily: MONO, color: "#8a5a1e" }}
                      dir="ltr"
                    >
                      NO SIGNUP · FREE
                    </span>
                  </Link>
                </div>
              ) : (
                /* Saved calculations — hairline ruled list */
                <div className="border-t" style={{ borderColor: LINE }}>
                  {calculations.map((calc) => (
                    <div
                      key={calc.id}
                      className="py-6 border-b hover:bg-[#E1EAF1]/25 transition-colors"
                      style={{ borderColor: LINE }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div
                            className="text-[11px] tracking-[0.16em] font-medium mb-1.5"
                            style={{ fontFamily: MONO, color: TURQ_TEXT }}
                          >
                            {calculatorTypeLabels[calc.calculator_type] || calc.calculator_type}
                          </div>
                          <h3 className="text-lg" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
                            {calc.title}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteCalculation(calc.id)}
                          aria-label="מחיקת החישוב"
                          className="shrink-0 p-2 text-[#5a6a78] hover:text-[#a04a5c] transition-colors"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                      </div>

                      <p className="mt-2 text-base" style={{ color: NAVY }}>
                        {formatResultSummary(calc)}
                      </p>

                      {calc.tips && calc.tips.length > 0 && (
                        <ul className="mt-3 space-y-0.5">
                          {calc.tips.slice(0, 2).map((tip, i) => (
                            <li key={i} className="dna-pill-item !py-1 text-[14px]">
                              {tip}
                            </li>
                          ))}
                        </ul>
                      )}

                      <p className="mt-3 text-[12px]" style={{ color: MUTED }}>
                        <span dir="ltr" style={monoNum}>{formatDate(calc.created_at)}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Next action */}
              <div className="mt-14 border-t pt-6 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4" style={{ borderColor: LINE }}>
                <p className="text-[14px] leading-[1.8] max-w-md" style={{ color: "#3a4c5a" }}>
                  רוצים לעבור על התוצאות עם יועץ? נבחן את המספרים מול התיק האמיתי שלכם, ללא עלות.
                </p>
                <Link
                  to="/contact"
                  className="group inline-flex items-center gap-2 text-[14px] font-medium text-[#1D2D3D] border-b border-[#1D2D3D]/25 pb-0.5 hover:border-[#1D2D3D] transition-colors shrink-0"
                >
                  לשיחה עם יועץ
                  <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={fetchCalculations}
      />
    </div>
  );
};

export default SavedCalculations;
