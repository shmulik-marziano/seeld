import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { siteSupabase } from "@/integrations/supabase/site-client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, LayoutDashboard, FileText, Lightbulb, FolderOpen, MessageCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PoliciesTab from "./PoliciesTab";
import RecommendationsTab from "./RecommendationsTab";
import DocumentsTab from "./DocumentsTab";
import ChatTab from "./ChatTab";

type Customer = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  created_at: string;
};

const PersonalAreaDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (user?.email) {
      fetchCustomer(user.email);
    }
  }, [user]);

  const fetchCustomer = async (email: string) => {
    try {
      const { data, error } = await siteSupabase
        .from("customers")
        .select("*")
        .eq("email", email)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setCustomer(data as Customer);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "התנתקת בהצלחה" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8f9fc" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#0a3d3d" }} />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#f8f9fc" }} dir="rtl">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: "#0a3d3d" }}>
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: "#0a3d3d" }}>
            עדיין אין לך תיק פעיל
          </h2>
          <p className="text-gray-500 mb-8 text-lg">
            צור קשר עם הסוכן שלך כדי לפתוח תיק אישי ולהתחיל לנהל את הביטוחים שלך.
          </p>
          <Button
            onClick={handleSignOut}
            className="rounded-full px-8 py-3 text-base font-medium"
            style={{ background: "#0a3d3d", color: "white" }}
          >
            <LogOut className="w-4 h-4 ml-2" />
            התנתק
          </Button>
        </div>
      </div>
    );
  }

  const displayName = customer
    ? [customer.first_name, customer.last_name].filter(Boolean).join(" ") || user?.email?.split("@")[0]
    : user?.user_metadata?.full_name || user?.email?.split("@")[0] || "משתמש";

  const statusLabel = customer?.status === "active" ? "פעיל" : customer?.status === "lead" ? "ליד" : customer?.status || "פעיל";

  return (
    <div className="min-h-screen" style={{ background: "#f8f9fc" }} dir="rtl">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold" style={{ background: "#0a3d3d" }}>
              {(customer?.first_name?.[0] || user?.email?.[0] || "?").toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: "#0a3d3d" }}>
                שלום, {displayName}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-gray-500 text-sm sm:text-base">ברוכים הבאים לאזור האישי שלך</p>
                <span
                  className="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium text-white"
                  style={{ background: customer?.status === "active" ? "#16a34a" : "#f59e0b" }}
                >
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="gap-2 min-h-[44px] rounded-full border-gray-300 hover:border-gray-400"
          >
            <LogOut className="w-4 h-4" />
            התנתק
          </Button>
        </div>

        {/* Main tabs */}
        <Tabs defaultValue="overview" dir="rtl">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide mb-8">
          <TabsList className="w-max sm:w-full grid grid-cols-5 h-auto bg-white rounded-2xl shadow-sm border p-1.5 min-w-[500px] sm:min-w-0">
            <TabsTrigger
              value="overview"
              className="gap-1.5 min-h-[44px] text-xs sm:text-sm rounded-xl data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
              style={{ "--tw-shadow-color": "#0a3d3d" } as React.CSSProperties}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">סקירה כללית</span>
              <span className="sm:hidden">סקירה</span>
            </TabsTrigger>
            <TabsTrigger
              value="policies"
              className="gap-1.5 min-h-[44px] text-xs sm:text-sm rounded-xl data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">הפוליסות שלי</span>
              <span className="sm:hidden">פוליסות</span>
            </TabsTrigger>
            <TabsTrigger
              value="recommendations"
              className="gap-1.5 min-h-[44px] text-xs sm:text-sm rounded-xl data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              <Lightbulb className="w-4 h-4" />
              <span className="hidden sm:inline">המלצות</span>
              <span className="sm:hidden">המלצות</span>
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="gap-1.5 min-h-[44px] text-xs sm:text-sm rounded-xl data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              <FolderOpen className="w-4 h-4" />
              <span className="hidden sm:inline">מסמכים</span>
              <span className="sm:hidden">מסמכים</span>
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="gap-1.5 min-h-[44px] text-xs sm:text-sm rounded-xl data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">צ'אט עם הסוכן</span>
              <span className="sm:hidden">צ'אט</span>
            </TabsTrigger>
          </TabsList>
          </div>

          {/* Tab 1: Overview */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Customer info card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border col-span-1 sm:col-span-2 lg:col-span-3">
                <h3 className="text-lg font-bold mb-4" style={{ color: "#0a3d3d" }}>פרטים אישיים</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#e0f2f1" }}>
                      <span style={{ color: "#0a3d3d" }} className="text-lg font-bold">
                        {(customer?.first_name?.[0] || "?").toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">שם מלא</p>
                      <p className="font-medium" style={{ color: "#0a3d3d" }}>
                        {[customer?.first_name, customer?.last_name].filter(Boolean).join(" ") || "---"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#fef3c7" }}>
                      <span className="text-lg">@</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">אימייל</p>
                      <p className="font-medium text-gray-700">{customer?.email || "---"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#ede9fe" }}>
                      <span className="text-lg">T</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">טלפון</p>
                      <p className="font-medium text-gray-700" dir="ltr">{customer?.phone || "---"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick action cards */}
              <QuickCard
                icon={<FileText className="w-6 h-6 text-white" />}
                bgColor="#0a3d3d"
                title="הפוליסות שלי"
                subtitle="צפה בכל הפוליסות והכיסויים שלך"
              />
              <QuickCard
                icon={<Lightbulb className="w-6 h-6 text-white" />}
                bgColor="#f59e0b"
                title="המלצות"
                subtitle="המלצות מותאמות אישית עבורך"
              />
              <QuickCard
                icon={<MessageCircle className="w-6 h-6 text-white" />}
                bgColor="#6366f1"
                title="צ'אט עם הסוכן"
                subtitle="שלח הודעה לסוכן שלך"
              />
            </div>
          </TabsContent>

          {/* Tab 2: Policies */}
          <TabsContent value="policies">
            <PoliciesTab />
          </TabsContent>

          {/* Tab 3: Recommendations */}
          <TabsContent value="recommendations">
            {customer && <RecommendationsTab customerId={customer.id} />}
          </TabsContent>

          {/* Tab 4: Documents */}
          <TabsContent value="documents">
            {customer && <DocumentsTab customerId={customer.id} />}
          </TabsContent>

          {/* Tab 5: Chat */}
          <TabsContent value="chat">
            {customer && <ChatTab customerId={customer.id} customerName={displayName || "לקוח"} />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const QuickCard = ({
  icon,
  bgColor,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  bgColor: string;
  title: string;
  subtitle: string;
}) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: bgColor }}>
      {icon}
    </div>
    <h4 className="font-bold text-base mb-1" style={{ color: "#0a3d3d" }}>{title}</h4>
    <p className="text-sm text-gray-500">{subtitle}</p>
  </div>
);

export default PersonalAreaDashboard;
