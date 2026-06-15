import { useEffect, useState } from "react";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Trash2, Calculator, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import AuthModal from "@/components/AuthModal";

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

const calculatorTypeColors: Record<string, string> = {
  mortgage: "#3b3f99",
  pension: "#d6157e",
  savings: "#f06ba8",
  goal: "#6b6fc4",
  compare: "#6c63ff",
};

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
        title: "שגיאה בטעינת החישובים",
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
        title: "שגיאה במחיקה",
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
    switch (calc.calculator_type) {
      case "mortgage":
        return `תשלום חודשי: ₪${(result.monthlyPayment as number)?.toLocaleString()}`;
      case "pension":
        return `פנסיה צפויה: ₪${(result.monthlyPension as number)?.toLocaleString()}`;
      case "savings":
        return `סכום סופי: ₪${(result.finalAmount as number)?.toLocaleString()}`;
      case "goal":
        return `הפקדה נדרשת: ₪${(result.monthlyRequired as number)?.toLocaleString()}`;
      case "compare":
        return `מסלול מומלץ: ${result.recommended || "לא נבחר"}`;
      default:
        return "";
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#d6157e]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero */}
      <section className="relative bg-[#f8f9fc] overflow-hidden">
        <div className="absolute top-6 left-10 w-20 h-20 rounded-full bg-[#6b6fc4] opacity-10" />
        <div className="absolute bottom-4 right-16 w-14 h-14 rounded-full bg-[#d6157e] opacity-15" />
        <svg className="absolute bottom-0 left-0 w-full h-16 opacity-10 pointer-events-none" viewBox="0 0 800 60" fill="none">
          <path d="M0 50 Q200 10 400 40 T800 20" stroke="#6b6fc4" strokeWidth="2" strokeDasharray="8 6" />
          <polygon points="795,18 800,20 795,22" fill="#6b6fc4" />
        </svg>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1a1a4b] mb-2">החישובים שלי</h1>
              <p className="text-gray-500">כל החישובים השמורים שלך במקום אחד</p>
            </div>
            <button
              onClick={() => navigate("/calculators")}
              className="hidden sm:inline-flex items-center gap-2 px-6 py-2.5 border-2 border-[#1a1a4b] text-[#1a1a4b] rounded-full text-sm font-semibold hover:bg-[#1a1a4b] hover:text-white transition-colors"
            >
              <Calculator className="w-4 h-4" />
              למחשבונים
            </button>
          </div>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Mobile button */}
        <div className="sm:hidden mb-6">
          <button
            onClick={() => navigate("/calculators")}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#d6157e] text-white rounded-full font-semibold"
          >
            <Calculator className="w-4 h-4" />
            למחשבונים
          </button>
        </div>

        {!user ? (
          <div className="rounded-2xl bg-[#f8f9fc] border border-gray-100 py-16 text-center">
            <p className="text-gray-500 mb-6">
              התחבר כדי לראות את החישובים השמורים שלך
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-8 py-3 bg-[#d6157e] text-white rounded-full font-semibold hover:bg-[#cc1672] transition-colors"
            >
              התחבר
            </button>
          </div>
        ) : calculations.length === 0 ? (
          <div className="rounded-2xl bg-[#f8f9fc] border border-gray-100 py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#6b6fc4] flex items-center justify-center mx-auto mb-4">
              <Calculator className="w-7 h-7 text-white" />
            </div>
            <p className="text-gray-500 mb-6">
              אין לך חישובים שמורים עדיין
            </p>
            <button
              onClick={() => navigate("/calculators")}
              className="px-8 py-3 bg-[#d6157e] text-white rounded-full font-semibold hover:bg-[#cc1672] transition-colors"
            >
              עבור למחשבונים
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {calculations.map((calc) => (
              <div key={calc.id} className="rounded-2xl bg-white border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <span
                      className="text-xs px-3 py-1 rounded-full font-medium text-white"
                      style={{ backgroundColor: calculatorTypeColors[calc.calculator_type] || "#d6157e" }}
                    >
                      {calculatorTypeLabels[calc.calculator_type]}
                    </span>
                    <h3 className="text-lg font-bold text-[#1a1a4b] mt-2">{calc.title}</h3>
                  </div>
                  <button
                    onClick={() => deleteCalculation(calc.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-lg font-semibold text-[#d6157e] mt-3">
                  {formatResultSummary(calc)}
                </p>
                {calc.tips && calc.tips.length > 0 && (
                  <div className="bg-[#f8f9fc] rounded-xl p-3 mt-3">
                    <p className="text-sm font-medium text-[#1a1a4b] mb-1">טיפים:</p>
                    <ul className="text-sm text-gray-500 list-disc list-inside">
                      {calc.tips.slice(0, 2).map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-3">
                  {formatDate(calc.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
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
