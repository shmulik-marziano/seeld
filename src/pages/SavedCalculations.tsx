import { useEffect, useState } from "react";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">החישובים שלי</h1>
            <Button onClick={() => navigate("/calculators")} variant="outline">
              <Calculator className="w-4 h-4 mr-2" />
              למחשבונים
            </Button>
          </div>

          {!user ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  התחבר כדי לראות את החישובים השמורים שלך
                </p>
                <Button onClick={() => setShowAuthModal(true)}>התחבר</Button>
              </CardContent>
            </Card>
          ) : calculations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calculator className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  אין לך חישובים שמורים עדיין
                </p>
                <Button onClick={() => navigate("/calculators")}>
                  עבור למחשבונים
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {calculations.map((calc) => (
                <Card key={calc.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                          {calculatorTypeLabels[calc.calculator_type]}
                        </span>
                        <CardTitle className="text-lg mt-2">{calc.title}</CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteCalculation(calc.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-medium text-primary mb-2">
                      {formatResultSummary(calc)}
                    </p>
                    {calc.tips && calc.tips.length > 0 && (
                      <div className="bg-muted/50 rounded-lg p-3 mt-3">
                        <p className="text-sm font-medium mb-1">טיפים:</p>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                          {calc.tips.slice(0, 2).map((tip, i) => (
                            <li key={i}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-3">
                      {formatDate(calc.created_at)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={fetchCalculations}
      />
    </div>
  );
};

export default SavedCalculations;
