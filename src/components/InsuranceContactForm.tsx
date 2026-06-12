import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { isValidIsraeliPhone } from "@/lib/utils";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";
import { Send } from "lucide-react";

interface InsuranceContactFormProps {
  insuranceType: string;
  title?: string;
  subtitle?: string;
}

const InsuranceContactForm = ({ 
  insuranceType, 
  title = "השאירו פרטים ונחזור אליכם", 
  subtitle = "מלאו את הטופס ונציג יצור איתכם קשר בהקדם" 
}: InsuranceContactFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({
        title: "שגיאה",
        description: "נא למלא שם וטלפון",
        variant: "destructive",
      });
      return;
    }

    if (!isValidIsraeliPhone(formData.phone)) {
      toast({
        title: "שגיאה",
        description: "מספר הטלפון אינו תקין",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase.from("contact_submissions").insert({
        name: formData.name.trim(),
        email: formData.email.trim() || `${formData.phone}@temp.com`,
        message: `[${insuranceType}] טלפון: ${formData.phone}\n${formData.message}`,
        subject: insuranceType,
      });

      if (error) throw error;

      // Send email notification
      try {
        await supabase.functions.invoke("send-lead-notification", {
          body: {
            type: "insurance",
            leadData: {
              fullName: formData.name.trim(),
              phone: formData.phone.trim(),
              email: formData.email.trim() || `${formData.phone}@temp.com`,
              insuranceType,
            },
          },
        });
      } catch (emailErr) {
        console.error("Failed to send email notification:", emailErr);
      }

      toast({
        title: "הפנייה נשלחה בהצלחה!",
        description: "נציג יצור איתכם קשר בהקדם",
      });
      
      setFormData({ name: "", phone: "", email: "", message: "" });
    } catch (error) {
      toast({
        title: "שגיאה בשליחה",
        description: "אנא נסו שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-4 sm:p-8 text-right">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-right block">שם מלא *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="הכניסו את שמכם"
              className="text-right"
              maxLength={100}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-right block">טלפון *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="050-0000000"
              className="text-right"
              maxLength={15}
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email" className="text-right block">אימייל (אופציונלי)</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="your@email.com"
            className="text-right"
            maxLength={255}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="message" className="text-right block">הודעה (אופציונלי)</Label>
          <Textarea
            id="message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="ספרו לנו קצת על מה שאתם מחפשים..."
            className="text-right min-h-[100px]"
            maxLength={1000}
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full rounded-full py-6 text-lg font-medium hover:scale-105 transition-all min-h-[48px]"
          disabled={isLoading}
        >
          {isLoading ? "שולח..." : (
            <>
              שלחו פנייה
              <Send className="w-5 h-5 mr-2" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default InsuranceContactForm;
