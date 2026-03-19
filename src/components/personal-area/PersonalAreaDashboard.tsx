import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { siteSupabase } from "@/integrations/supabase/site-client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LogOut, LayoutDashboard, FileText, Lightbulb,
  FolderOpen, MessageCircle, Loader2, Phone, Mail,
  Shield, Wallet, Heart, ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
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
    toast.success("התנתקת בהצלחה");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#0a3d3d]" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex items-center justify-center px-4 py-16" dir="rtl">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-[#0a3d3d]">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-[#0a3d3d]">
            עדיין אין לך תיק פעיל
          </h2>
          <p className="text-gray-500 mb-8 text-lg">
            צור קשר עם הסוכן שלך כדי לפתוח תיק אישי ולהתחיל לנהל את הביטוחים שלך.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://wa.me/972523097444"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full px-6 py-3 font-semibold text-sm transition-colors shadow-lg shadow-[#25D366]/20 min-h-[48px]"
            >
              <Phone className="w-4 h-4" />
              שלח הודעת WhatsApp
            </a>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="rounded-full px-6 py-3 border-gray-300 hover:border-gray-400 min-h-[48px]"
            >
              <LogOut className="w-4 h-4 ml-2" />
              התנתק
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const displayName = customer
    ? [customer.first_name, customer.last_name].filter(Boolean).join(" ") || user?.email?.split("@")[0]
    : user?.user_metadata?.full_name || user?.email?.split("@")[0] || "משתמש";

  const initials = (customer?.first_name?.[0] || user?.email?.[0] || "?").toUpperCase();

  const statusLabel = customer?.status === "active" ? "פעיל" : customer?.status === "lead" ? "ליד" : customer?.status || "פעיל";
  const statusColor = customer?.status === "active" ? "#16a34a" : "#f59e0b";

  return (
    <div dir="rtl">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg"
            style={{ background: "linear-gradient(135deg, #0a3d3d 0%, #0d4a4a 100%)" }}
          >
            {initials}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a3d3d]">
              שלום, {displayName}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-gray-500 text-sm sm:text-base">ברוכים הבאים לאזור האישי שלך</p>
              <span
                className="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium text-white"
                style={{ background: statusColor }}
              >
                {statusLabel}
              </span>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleSignOut}
          className="gap-2 min-h-[44px] rounded-full border-gray-300 hover:border-gray-400 text-gray-600 hover:text-[#0a3d3d]"
        >
          <LogOut className="w-4 h-4" />
          התנתק
        </Button>
      </div>

      {/* Main tabs */}
      <Tabs defaultValue="overview" dir="rtl">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide mb-8">
          <TabsList className="w-max sm:w-full grid grid-cols-5 h-auto bg-white rounded-2xl shadow-sm border p-1.5 min-w-[520px] sm:min-w-0">
            <TabsTrigger
              value="overview"
              className="gap-1.5 min-h-[44px] text-xs sm:text-sm rounded-xl data-[state=active]:bg-[#0a3d3d] data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">סקירה כללית</span>
              <span className="sm:hidden">סקירה</span>
            </TabsTrigger>
            <TabsTrigger
              value="policies"
              className="gap-1.5 min-h-[44px] text-xs sm:text-sm rounded-xl data-[state=active]:bg-[#0a3d3d] data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">הפוליסות שלי</span>
              <span className="sm:hidden">פוליסות</span>
            </TabsTrigger>
            <TabsTrigger
              value="recommendations"
              className="gap-1.5 min-h-[44px] text-xs sm:text-sm rounded-xl data-[state=active]:bg-[#0a3d3d] data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              <Lightbulb className="w-4 h-4" />
              המלצות
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="gap-1.5 min-h-[44px] text-xs sm:text-sm rounded-xl data-[state=active]:bg-[#0a3d3d] data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              <FolderOpen className="w-4 h-4" />
              מסמכים
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="gap-1.5 min-h-[44px] text-xs sm:text-sm rounded-xl data-[state=active]:bg-[#0a3d3d] data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">צ'אט עם הסוכן</span>
              <span className="sm:hidden">צ'אט</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ══════ Tab: Overview ══════ */}
        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Personal info card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border relative overflow-hidden">
              {/* Decorative corner accent */}
              <div className="absolute top-0 left-0 w-32 h-32 opacity-[0.04] pointer-events-none"
                style={{ background: "radial-gradient(circle at top left, #5ec6c6, transparent 70%)" }} />

              <h3 className="text-lg font-bold mb-5 text-[#0a3d3d] flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0a3d3d]/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-[#0a3d3d]" />
                </div>
                פרטים אישיים
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InfoItem
                  icon={<span className="text-lg font-bold text-[#0a3d3d]">{initials}</span>}
                  iconBg="#e0f2f1"
                  label="שם מלא"
                  value={[customer?.first_name, customer?.last_name].filter(Boolean).join(" ") || "---"}
                  valueColor="#0a3d3d"
                />
                <InfoItem
                  icon={<Mail className="w-4 h-4 text-[#f4a261]" />}
                  iconBg="#fef3c7"
                  label="אימייל"
                  value={customer?.email || "---"}
                />
                <InfoItem
                  icon={<Phone className="w-4 h-4 text-[#6366f1]" />}
                  iconBg="#ede9fe"
                  label="טלפון"
                  value={customer?.phone || "---"}
                  dir="ltr"
                />
              </div>
            </div>

            {/* Quick action cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <QuickCard
                icon={<FileText className="w-6 h-6 text-white" />}
                gradient="linear-gradient(135deg, #0a3d3d 0%, #125555 100%)"
                shadowColor="rgba(10,61,61,0.25)"
                title="הפוליסות שלי"
                subtitle="צפה בכל הפוליסות והכיסויים שלך"
              />
              <QuickCard
                icon={<Lightbulb className="w-6 h-6 text-white" />}
                gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                shadowColor="rgba(245,158,11,0.25)"
                title="המלצות"
                subtitle="המלצות מותאמות אישית עבורך"
              />
              <QuickCard
                icon={<MessageCircle className="w-6 h-6 text-white" />}
                gradient="linear-gradient(135deg, #5ec6c6 0%, #3ba8a8 100%)"
                shadowColor="rgba(94,198,198,0.25)"
                title="צ'אט עם הסוכן"
                subtitle="שלח הודעה לסוכן שלך"
              />
            </div>

            {/* Insurance summary placeholder cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard icon={<Shield className="w-5 h-5" />} iconColor="#0a3d3d" iconBg="#e0f2f1" label="ביטוחים" value="—" />
              <StatCard icon={<Wallet className="w-5 h-5" />} iconColor="#f59e0b" iconBg="#fef3c7" label="חסכונות" value="—" />
              <StatCard icon={<Heart className="w-5 h-5" />} iconColor="#e76f51" iconBg="#fee2e2" label="המלצות חדשות" value="—" />
              <StatCard icon={<FolderOpen className="w-5 h-5" />} iconColor="#6366f1" iconBg="#ede9fe" label="מסמכים" value="—" />
            </div>
          </div>
        </TabsContent>

        {/* ══════ Tab: Policies ══════ */}
        <TabsContent value="policies">
          <PoliciesTab />
        </TabsContent>

        {/* ══════ Tab: Recommendations ══════ */}
        <TabsContent value="recommendations">
          {customer && <RecommendationsTab customerId={customer.id} />}
        </TabsContent>

        {/* ══════ Tab: Documents ══════ */}
        <TabsContent value="documents">
          {customer && <DocumentsTab customerId={customer.id} />}
        </TabsContent>

        {/* ══════ Tab: Chat ══════ */}
        <TabsContent value="chat">
          {customer && <ChatTab customerId={customer.id} customerName={displayName || "לקוח"} />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

/* ─── Sub-components ─── */

const InfoItem = ({
  icon,
  iconBg,
  label,
  value,
  valueColor = "#374151",
  dir,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  valueColor?: string;
  dir?: string;
}) => (
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: iconBg }}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-medium text-sm truncate" style={{ color: valueColor }} dir={dir}>
        {value}
      </p>
    </div>
  </div>
);

const QuickCard = ({
  icon,
  gradient,
  shadowColor,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  gradient: string;
  shadowColor: string;
  title: string;
  subtitle: string;
}) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-md transition-all cursor-pointer group">
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-transform"
      style={{ background: gradient, boxShadow: `0 4px 14px ${shadowColor}` }}
    >
      {icon}
    </div>
    <h4 className="font-bold text-base mb-1 text-[#0a3d3d]">{title}</h4>
    <p className="text-sm text-gray-500">{subtitle}</p>
  </div>
);

const StatCard = ({
  icon,
  iconColor,
  iconBg,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
}) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border text-center">
    <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: iconBg, color: iconColor }}>
      {icon}
    </div>
    <p className="text-2xl font-extrabold text-[#0a3d3d] mb-1">{value}</p>
    <p className="text-xs text-gray-400">{label}</p>
  </div>
);

export default PersonalAreaDashboard;
