import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type AddPolicyDialogProps = {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
};

const AddPolicyDialog = ({ open, onClose, onAdded }: AddPolicyDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    policy_type: "insurance",
    policy_name: "",
    policy_number: "",
    provider: "",
    start_date: "",
    end_date: "",
    monthly_premium: "",
    coverage_amount: "",
    notes: "",
  });

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.policy_name) return;
    setLoading(true);

    try {
      const { error } = await supabase.from("user_policies").insert({
        user_id: user.id,
        policy_type: form.policy_type,
        policy_name: form.policy_name,
        policy_number: form.policy_number || null,
        provider: form.provider || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        monthly_premium: form.monthly_premium ? Number(form.monthly_premium) : null,
        coverage_amount: form.coverage_amount ? Number(form.coverage_amount) : null,
        notes: form.notes || null,
      });

      if (error) throw error;

      toast({ title: "הפוליסה נוספה בהצלחה" });
      onAdded();
      onClose();
      setForm({
        policy_type: "insurance",
        policy_name: "",
        policy_number: "",
        provider: "",
        start_date: "",
        end_date: "",
        monthly_premium: "",
        coverage_amount: "",
        notes: "",
      });
    } catch (error) {
      toast({
        title: "שגיאה בהוספה",
        description: error instanceof Error ? error.message : "נסה שוב",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>הוספת פוליסה חדשה</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>סוג</Label>
              <Select value={form.policy_type} onValueChange={(v) => updateField("policy_type", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="insurance">ביטוח</SelectItem>
                  <SelectItem value="savings">חיסכון</SelectItem>
                  <SelectItem value="pension">פנסיה</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>שם הפוליסה *</Label>
              <Input
                value={form.policy_name}
                onChange={(e) => updateField("policy_name", e.target.value)}
                placeholder="ביטוח בריאות כללית"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>מספר פוליסה</Label>
              <Input
                value={form.policy_number}
                onChange={(e) => updateField("policy_number", e.target.value)}
                placeholder="12345678"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>חברה מבטחת</Label>
              <Input
                value={form.provider}
                onChange={(e) => updateField("provider", e.target.value)}
                placeholder="כלל / הראל / מגדל..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>תאריך התחלה</Label>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => updateField("start_date", e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>תאריך סיום</Label>
              <Input
                type="date"
                value={form.end_date}
                onChange={(e) => updateField("end_date", e.target.value)}
                dir="ltr"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>פרמיה חודשית (₪)</Label>
              <Input
                type="number"
                value={form.monthly_premium}
                onChange={(e) => updateField("monthly_premium", e.target.value)}
                placeholder="350"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>סכום כיסוי (₪)</Label>
              <Input
                type="number"
                value={form.coverage_amount}
                onChange={(e) => updateField("coverage_amount", e.target.value)}
                placeholder="500000"
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>הערות</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="הערות נוספות..."
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "הוסף פוליסה"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPolicyDialog;
