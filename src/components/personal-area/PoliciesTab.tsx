import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, FileText, Shield, Wallet, Trash2, Calendar, Building2 } from "lucide-react";
import AddPolicyDialog from "./AddPolicyDialog";

export type UserPolicy = {
  id: string;
  policy_type: string;
  policy_name: string;
  policy_number: string | null;
  provider: string | null;
  start_date: string | null;
  end_date: string | null;
  monthly_premium: number | null;
  coverage_amount: number | null;
  status: string;
  notes: string | null;
  created_at: string;
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "פעיל", variant: "default" },
  pending: { label: "ממתין", variant: "secondary" },
  expired: { label: "פג תוקף", variant: "destructive" },
  cancelled: { label: "מבוטל", variant: "outline" },
};

const policyTypeLabels: Record<string, { label: string; icon: typeof Shield }> = {
  insurance: { label: "ביטוח", icon: Shield },
  savings: { label: "חיסכון", icon: Wallet },
  pension: { label: "פנסיה", icon: Building2 },
};

const PoliciesTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [policies, setPolicies] = useState<UserPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    if (user) fetchPolicies();
  }, [user]);

  const fetchPolicies = async () => {
    try {
      const { data, error } = await supabase
        .from("user_policies")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPolicies((data || []) as UserPolicy[]);
    } catch {
      toast({ title: "שגיאה בטעינת הפוליסות", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const deletePolicy = async (id: string) => {
    try {
      const { error } = await supabase
        .from("user_policies")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setPolicies((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "הפוליסה נמחקה" });
    } catch {
      toast({ title: "שגיאה במחיקה", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">הפוליסות והחסכונות שלי</h2>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          הוסף פוליסה
        </Button>
      </div>

      {policies.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="w-14 h-14 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium mb-2">אין פוליסות עדיין</p>
            <p className="text-muted-foreground mb-6">
              הוסף את הפוליסות שלך כדי לנהל אותן במקום אחד
            </p>
            <Button onClick={() => setShowAddDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              הוסף פוליסה ראשונה
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {policies.map((policy) => {
            const typeInfo = policyTypeLabels[policy.policy_type] || policyTypeLabels.insurance;
            const statusInfo = statusLabels[policy.status] || statusLabels.active;
            const IconComp = typeInfo.icon;

            return (
              <Card key={policy.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                        <IconComp className="w-5 h-5 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{policy.policy_name}</h3>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                          <Badge variant="outline">{typeInfo.label}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                          {policy.provider && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5" />
                              {policy.provider}
                            </span>
                          )}
                          {policy.policy_number && (
                            <span>מס׳: {policy.policy_number}</span>
                          )}
                          {policy.start_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(policy.start_date).toLocaleDateString("he-IL")}
                              {policy.end_date && ` — ${new Date(policy.end_date).toLocaleDateString("he-IL")}`}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-6 text-sm pt-1">
                          {policy.monthly_premium != null && (
                            <span>
                              <span className="text-muted-foreground">פרמיה חודשית: </span>
                              <span className="font-medium">₪{policy.monthly_premium.toLocaleString()}</span>
                            </span>
                          )}
                          {policy.coverage_amount != null && (
                            <span>
                              <span className="text-muted-foreground">סכום כיסוי: </span>
                              <span className="font-medium">₪{policy.coverage_amount.toLocaleString()}</span>
                            </span>
                          )}
                        </div>
                        {policy.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{policy.notes}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deletePolicy(policy.id)}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AddPolicyDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdded={fetchPolicies}
      />
    </div>
  );
};

export default PoliciesTab;
