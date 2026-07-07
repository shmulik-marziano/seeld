import { useState } from "react";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/site-types";

type CalculatorType =
  | "mortgage"
  | "pension"
  | "savings"
  | "goal"
  | "compare"
  | "income-tax"
  | "life-insurance"
  | "car-insurance";

type SaveCalculationParams = {
  calculatorType: CalculatorType;
  title?: string;
  inputData: Json;
  resultData: Json;
  tips?: string[];
};

export const useSaveCalculation = () => {
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const saveCalculation = async ({
    calculatorType,
    title,
    inputData,
    resultData,
    tips,
  }: SaveCalculationParams) => {
    if (!user) {
      return { success: false, needsAuth: true };
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("saved_calculations").insert([{
        user_id: user.id,
        calculator_type: calculatorType,
        title: title || getDefaultTitle(calculatorType),
        input_data: inputData,
        result_data: resultData,
        tips: tips || [],
      }]);

      if (error) throw error;

      toast({
        title: "נשמר בהצלחה!",
        description: "תוצאות החישוב נשמרו לחשבון שלך",
      });

      return { success: true, needsAuth: false };
    } catch (error) {
      toast({
        title: "שגיאה בשמירה",
        description: error instanceof Error ? error.message : "אירעה שגיאה",
        variant: "destructive",
      });
      return { success: false, needsAuth: false };
    } finally {
      setSaving(false);
    }
  };

  return { saveCalculation, saving };
};

const getDefaultTitle = (type: CalculatorType): string => {
  const titles: Record<CalculatorType, string> = {
    mortgage: "חישוב משכנתא",
    pension: "חישוב פנסיה",
    savings: "חישוב חיסכון",
    goal: "חישוב יעד פיננסי",
    compare: "השוואת מסלולי השקעה",
    "income-tax": "חישוב מס הכנסה",
    "life-insurance": "חישוב ביטוח חיים",
    "car-insurance": "הערכת ביטוח רכב",
  };
  return `${titles[type]} - ${new Date().toLocaleDateString("he-IL")}`;
};
