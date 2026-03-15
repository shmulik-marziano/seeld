import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, FileText, LogOut, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ProfileTab from "./ProfileTab";
import PoliciesTab from "./PoliciesTab";

const PersonalAreaDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "התנתקת בהצלחה" });
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "משתמש";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">שלום, {displayName}</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">ברוכים הבאים לאזור האישי שלך ב-SeelD</p>
        </div>
        <Button variant="outline" onClick={handleSignOut} className="gap-2 min-h-[44px]">
          <LogOut className="w-4 h-4" />
          התנתק
        </Button>
      </div>

      {/* Main tabs */}
      <Tabs defaultValue="profile" dir="rtl">
        <TabsList className="w-full grid grid-cols-2 mb-6 h-auto">
          <TabsTrigger value="profile" className="gap-2 min-h-[44px] text-sm">
            <User className="w-4 h-4" />
            הפרופיל שלי
          </TabsTrigger>
          <TabsTrigger value="policies" className="gap-2 min-h-[44px] text-sm">
            <FileText className="w-4 h-4" />
            הפוליסות שלי
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>

        <TabsContent value="policies">
          <PoliciesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PersonalAreaDashboard;
