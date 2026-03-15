import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Mail, Phone, User, Calendar } from "lucide-react";

type Profile = {
  full_name: string | null;
  email: string | null;
  phone?: string | null;
};

const ProfileTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    email: "",
  });

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;

      setProfile({
        full_name: data?.full_name || user?.user_metadata?.full_name || "",
        email: data?.email || user?.email || "",
      });
    } catch {
      setProfile({
        full_name: user?.user_metadata?.full_name || "",
        email: user?.email || "",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Upsert profile
      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          full_name: profile.full_name,
          email: profile.email,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (error) throw error;

      toast({ title: "הפרופיל עודכן בהצלחה" });
    } catch (error) {
      toast({
        title: "שגיאה בשמירה",
        description: error instanceof Error ? error.message : "נסה שוב",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <User className="w-5 h-5" />
            פרטים אישיים
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                שם מלא
              </Label>
              <Input
                id="fullName"
                value={profile.full_name || ""}
                onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
                placeholder="ישראל ישראלי"
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                אימייל
              </Label>
              <Input
                id="email"
                value={profile.email || ""}
                disabled
                dir="ltr"
                className="text-left bg-muted/50"
              />
            </div>
          </div>

          <div className="flex justify-start pt-2">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              שמור שינויים
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account info card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            פרטי חשבון
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="text-muted-foreground mb-1">כתובת מייל</p>
              <p className="font-medium" dir="ltr">{user?.email}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="text-muted-foreground mb-1">תאריך הצטרפות</p>
              <p className="font-medium">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString("he-IL", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileTab;
