import { useEffect, useState } from "react";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import AuthModal from "@/components/AuthModal";
import { SERIF, MONO } from "@/lib/brand";

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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("he-IL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
      default:
        return null;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen pb-2" style={{ backgroundColor: "#171717" }}>
        <Header />
        <div className="px-2 pt-2">
          <div className="bento-panel">
            <div className="relative z-10 flex flex-col items-center justify-center gap-4 h-[60vh]" dir="rtl">
              <Loader2 className="w-6 h-6 animate-spin text-[#171717]" />
              <p className="text-[14px] text-[#5c5c5c]">טוען את החישובים השמורים...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-2" dir="rtl" style={{ backgroundColor: "#171717" }}>
      <Header />

      {/* Hero tile — hairline rule + breadcrumb, compact */}
      <section className="px-2 pt-2">
        <div className="bento-panel"><div className="max-w-4xl mx-auto px-5 sm:px-8 pt-10 sm:pt-14 pb-10 sm:pb-14 relative z-10">
          <div className="border-t border-[#171717]/20 pt-5 mb-10 sm:mb-14 flex items-baseline justify-between gap-4">
            <nav className="flex items-center gap-2 text-[12px] text-[#5c5c5c]">
              <Link to="/" className="hover:text-[#171717] transition-colors">דף הבית</Link>
              <span>←</span>
              <Link to="/calculators" className="hover:text-[#171717] transition-colors">מחשבונים</Link>
              <span>←</span>
              <span className="text-[#171717]/70 font-medium">החישובים שלי</span>
            </nav>
            <span className="hidden sm:block text-[11px] tracking-[0.22em] font-medium text-[#5c5c5c]">
              אזור אישי
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <h1
                className="text-[#171717] leading-[1.15] mb-4"
                style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(2rem, 5vw, 3.4rem)" }}
              >
                החישובים שלי
              </h1>
              <p className="text-base sm:text-[17px] text-[#4d4d4d] leading-[1.9]">
                כל החישובים ששמרתם מהמחשבונים, במקום אחד.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/calculators")}
              className="shrink-0 inline-flex items-center justify-center px-7 py-3.5 bg-[#171717] text-[#fafafa] text-base font-medium tracking-wide hover:bg-[#262626] transition-colors min-h-[48px]"
            >
              למחשבונים
            </button>
          </div>
        </div></div>
      </section>

      <main>
        <section className="px-2 pt-2">
          <div className="bento-panel"><div className="max-w-4xl mx-auto px-5 sm:px-8 py-12 sm:py-16 relative z-10">
            {!user ? (
              /* Not signed in */
              <div className="border-t border-[#171717]/15 pt-6">
                <h2 className="text-xl text-[#171717] mb-3" style={{ fontFamily: SERIF, fontWeight: 600 }}>
                  נדרשת התחברות
                </h2>
                <p className="text-base text-[#4d4d4d] leading-[1.85] max-w-xl mb-7">
                  החישובים השמורים מקושרים לחשבון שלכם. התחברו כדי לראות אותם,
                  או פתחו מחשבון וחשבו בלי רישום.
                </p>
                <div className="flex flex-wrap items-center gap-6">
                  <button
                    type="button"
                    onClick={() => setShowAuthModal(true)}
                    className="inline-flex items-center justify-center px-9 py-4 bg-[#171717] text-[#fafafa] text-base font-medium tracking-wide hover:bg-[#262626] transition-colors min-h-[52px]"
                  >
                    התחברות
                  </button>
                  <Link
                    to="/calculators"
                    className="group inline-flex items-center gap-2 text-base font-medium text-[#171717] border-b border-[#171717]/25 pb-0.5 hover:border-[#171717] transition-colors"
                  >
                    למחשבונים בלי רישום
                    <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
                  </Link>
                </div>
              </div>
            ) : calculations.length === 0 ? (
              /* Empty state — small orange tile CTA to /calculators (the play) */
              <div className="border-t border-[#171717]/15 pt-6">
                <h2 className="text-xl text-[#171717] mb-3" style={{ fontFamily: SERIF, fontWeight: 600 }}>
                  אין חישובים שמורים עדיין
                </h2>
                <p className="text-base text-[#4d4d4d] leading-[1.85] max-w-xl mb-7">
                  פתחו מחשבון משכנתא, פנסיה או חיסכון, ושמרו את התוצאה.
                  היא תופיע כאן ותוכלו לחזור אליה מכל מכשיר.
                </p>
                <Link
                  to="/calculators"
                  className="bento-panel-orange inline-flex flex-col items-start gap-1.5 px-7 py-5 hover:-translate-y-[1px] transition-transform"
                >
                  <span className="text-[15px] font-semibold text-[#171717]">פתיחת מחשבון ←</span>
                  <span
                    className="text-[10px] tracking-[0.2em] font-semibold text-[#171717]/80"
                    style={{ fontFamily: MONO }}
                    dir="ltr"
                  >
                    NO SIGNUP · FREE
                  </span>
                </Link>
              </div>
            ) : (
              /* Saved calculations — ruled list */
              <div className="border-t border-[#171717]/15">
                {calculations.map((calc) => (
                  <div key={calc.id} className="py-6 border-b border-[#171717]/10 hover:bg-[#171717]/[0.04] hover:border-[#171717]/40 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-[11px] tracking-[0.16em] font-medium mb-1.5 text-[#5c5c5c]" style={{ fontFamily: MONO }}>
                          {calculatorTypeLabels[calc.calculator_type] || calc.calculator_type}
                        </div>
                        <h3 className="text-lg text-[#171717]" style={{ fontFamily: SERIF, fontWeight: 600 }}>
                          {calc.title}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteCalculation(calc.id)}
                        aria-label="מחיקת החישוב"
                        className="shrink-0 p-2 text-[#5c5c5c] hover:text-[#b91c1c] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </div>

                    <p className="mt-2 text-base text-[#171717]">
                      {formatResultSummary(calc)}
                    </p>

                    {calc.tips && calc.tips.length > 0 && (
                      <ul className="mt-3 space-y-1.5">
                        {calc.tips.slice(0, 2).map((tip, i) => (
                          <li key={i} className="flex gap-2.5 text-[14px] text-[#4d4d4d] leading-[1.7]">
                            <span className="text-[#5c5c5c]">—</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    )}

                    <p className="mt-3 text-[12px] text-[#5c5c5c] tabular-nums">
                      {formatDate(calc.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Next action */}
            <div className="mt-14 border-t border-[#171717]/15 pt-6 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4">
              <p className="text-[14px] text-[#4d4d4d] leading-[1.8] max-w-md">
                רוצים לעבור על התוצאות עם יועץ? נבחן את המספרים מול התיק האמיתי שלכם, ללא עלות.
              </p>
              <Link
                to="/contact"
                className="group inline-flex items-center gap-2 text-[14px] font-medium text-[#171717] border-b border-[#171717]/25 pb-0.5 hover:border-[#171717] transition-colors shrink-0"
              >
                לשיחה עם יועץ
                <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
              </Link>
            </div>
          </div></div>
        </section>
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
