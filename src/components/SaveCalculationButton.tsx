import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save, Mail, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSaveCalculation } from "@/hooks/useSaveCalculation";
import AuthModal from "@/components/AuthModal";
import { Json } from "@/integrations/supabase/site-types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type CalculatorType =
  | "mortgage"
  | "pension"
  | "savings"
  | "goal"
  | "compare"
  | "income-tax"
  | "life-insurance"
  | "car-insurance";

type SaveCalculationButtonProps = {
  calculatorType: CalculatorType;
  title?: string;
  inputData: Json;
  resultData: Json;
  tips?: string[];
  disabled?: boolean;
};

const calculatorTypeLabels: Record<CalculatorType, string> = {
  mortgage: "משכנתא",
  pension: "פנסיה",
  savings: "חיסכון",
  goal: "יעד פיננסי",
  compare: "השוואת מסלולים",
  "income-tax": "מס הכנסה",
  "life-insurance": "ביטוח חיים",
  "car-insurance": "ביטוח רכב",
};

const SaveCalculationButton = ({
  calculatorType,
  title,
  inputData,
  resultData,
  tips,
  disabled,
}: SaveCalculationButtonProps) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const { user } = useAuth();
  const { saveCalculation, saving } = useSaveCalculation();
  const { toast } = useToast();

  const handleSave = async () => {
    const { needsAuth } = await saveCalculation({
      calculatorType,
      title,
      inputData,
      resultData,
      tips,
    });

    if (needsAuth) {
      setShowAuthModal(true);
    }
  };

  const handleAuthSuccess = () => {
    saveCalculation({
      calculatorType,
      title,
      inputData,
      resultData,
      tips,
    });
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSendingEmail(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-calculation-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            to: email,
            calculatorType,
            title: title || `חישוב ${calculatorTypeLabels[calculatorType]}`,
            inputData,
            resultData,
            tips,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "שגיאה בשליחה");
      }

      toast({
        title: "נשלח בהצלחה!",
        description: `תוצאות החישוב נשלחו ל-${email}`,
      });
      setShowEmailModal(false);
      setEmail("");
    } catch (error) {
      toast({
        title: "שגיאה בשליחת המייל",
        description: error instanceof Error ? error.message : "נסו שוב",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={disabled || saving}
          variant="outline"
          className="gap-2"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {user ? "שמור" : "התחבר ושמור"}
        </Button>

        <Button
          onClick={() => setShowEmailModal(true)}
          disabled={disabled}
          variant="outline"
          className="gap-2"
        >
          <Mail className="w-4 h-4" />
          שלח במייל
        </Button>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>שליחת תוצאות במייל</DialogTitle>
            <DialogDescription>
              הזינו כתובת מייל לקבלת תוצאות החישוב
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendEmail} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="email">כתובת מייל</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
                dir="ltr"
                className="text-left"
              />
            </div>

            <Button type="submit" className="w-full" disabled={sendingEmail}>
              {sendingEmail ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  שלח
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SaveCalculationButton;
