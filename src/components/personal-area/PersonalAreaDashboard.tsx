import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { siteSupabase } from "@/integrations/supabase/site-client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LogOut, LayoutDashboard, FileText, Lightbulb,
  FolderOpen, MessageCircle, Loader2, Phone, Mail,
  Shield, Wallet, Heart, Bot, AlertTriangle,
  TrendingUp, Clock, CheckCircle2, Activity
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import PoliciesTab from "./PoliciesTab";
import RecommendationsTab from "./RecommendationsTab";
import DocumentsTab from "./DocumentsTab";
import ChatTab from "./ChatTab";
import ClientAIChatbot from "./ClientAIChatbot";
import DisclaimerBanner, { LegalFooterDisclaimer } from "./DisclaimerBanner";

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
        setCustomer(data as unknown as Customer);
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
        <Loader2 className="w-8 h-8 animate-spin text-[#1a1a4b]" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex items-center justify-center px-4 py-16" dir="rtl">
        <div className="text-center max-w-md">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #1a1a4b 0%, #2a2a66 100%)" }}
          >
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-[#1a1a4b]">
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
    <div dir="rtl" className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/60 p-5 sm:p-8 lg:p-10 relative overflow-hidden min-h-[60vh]">
      {/* Soft inner glow absolute background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-gradient-to-bl from-[#d6157e]/10 to-transparent pointer-events-none -translate-y-1/2 translate-x-1/3" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6"
      >
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg relative"
            style={{ background: "linear-gradient(135deg, #1a1a4b 0%, #222159 100%)" }}
          >
            {initials}
            {/* Status dot */}
            <div
              className="absolute -bottom-0.5 -left-0.5 w-4 h-4 rounded-full border-2 border-[#f8f9fc]"
              style={{ background: statusColor }}
            />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1a1a4b]">
              שלום, {displayName}
            </h1>
            <p className="text-gray-400 text-sm sm:text-base mt-0.5">ברוכים הבאים לאזור האישי שלך</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleSignOut}
          className="gap-2 min-h-[44px] rounded-full border-gray-200 hover:border-gray-300 text-gray-500 hover:text-[#1a1a4b]"
        >
          <LogOut className="w-4 h-4" />
          התנתק
        </Button>
      </motion.div>

      {/* ══════ Info disclaimer ══════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-6"
      >
        <DisclaimerBanner
          variant="info"
          text="* המידע המוצג באזור האישי הינו לצרכי מידע כללי בלבד ואינו מחליף ייעוץ מקצועי. לפני ביצוע כל פעולה, מומלץ להתייעץ עם סוכן הביטוח שלך."
        />
      </motion.div>

      {/* ══════ Main tabs ══════ */}
      <Tabs defaultValue="overview" dir="rtl">
        <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0 scrollbar-hide mb-8 sm:mb-12 relative z-10">
          <TabsList className="w-max sm:w-full flex justify-between h-auto bg-[#f8f9fc]/80 backdrop-blur-md rounded-full shadow-inner border border-[#1a1a4b]/5 p-1.5 sm:p-2 min-w-[620px] sm:min-w-0 gap-1 sm:gap-2">
            {[
              { value: "overview", icon: LayoutDashboard, label: "סקירה", labelFull: "סקירה כללית" },
              { value: "policies", icon: FileText, label: "פוליסות", labelFull: "הפוליסות שלי" },
              { value: "recommendations", icon: Lightbulb, label: "המלצות", labelFull: "המלצות הסוכן" },
              { value: "documents", icon: FolderOpen, label: "מסמכים", labelFull: "מסמכים אישיים" },
              { value: "chat", icon: MessageCircle, label: "צ'אט", labelFull: "צ'אט עם הסוכן" },
              { value: "ai", icon: Bot, label: "עוזר", labelFull: "עוזר חכם" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex-1 gap-2 min-h-[46px] text-[13px] sm:text-sm font-semibold rounded-full data-[state=active]:bg-white data-[state=active]:text-[#1a1a4b] data-[state=inactive]:text-[#1a1a4b]/60 data-[state=active]:shadow-[0_4px_20px_rgba(10,61,61,0.08)] transition-all duration-300"
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.labelFull}</span>
                <span className="sm:hidden">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ══════ Tab: Overview ══════ */}
        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Stats row — bubble cards */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
            >
              <BubbleStatCard icon={<Shield className="w-5 h-5" />} color="#1a1a4b" bg="#fce7f3" label="ביטוחים פעילים" value="—" />
              <BubbleStatCard icon={<Wallet className="w-5 h-5" />} color="#f59e0b" bg="#fef3c7" label="חסכונות" value="—" />
              <BubbleStatCard icon={<Lightbulb className="w-5 h-5" />} color="#3b3f99" bg="#fee2e2" label="המלצות חדשות" value="—" />
              <BubbleStatCard icon={<Activity className="w-5 h-5" />} color="#6366f1" bg="#ede9fe" label="פעולות אחרונות" value="—" />
            </motion.div>

            {/* Personal info bubble card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-40 h-40 opacity-[0.03] pointer-events-none"
                style={{ background: "radial-gradient(circle at top left, #d6157e, transparent 70%)" }} />

              <h3 className="text-lg font-bold mb-5 text-[#1a1a4b] flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#fce7f3] flex items-center justify-center">
                  <Shield className="w-4 h-4 text-[#1a1a4b]" />
                </div>
                פרטים אישיים
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <BubbleInfoItem
                  icon={<span className="text-sm font-bold text-[#1a1a4b]">{initials}</span>}
                  iconBg="#fce7f3"
                  label="שם מלא"
                  value={[customer?.first_name, customer?.last_name].filter(Boolean).join(" ") || "---"}
                  valueColor="#1a1a4b"
                />
                <BubbleInfoItem
                  icon={<Mail className="w-4 h-4 text-[#6b6fc4]" />}
                  iconBg="#fef3c7"
                  label="אימייל"
                  value={customer?.email || "---"}
                />
                <BubbleInfoItem
                  icon={<Phone className="w-4 h-4 text-[#6366f1]" />}
                  iconBg="#ede9fe"
                  label="טלפון"
                  value={customer?.phone || "---"}
                  dir="ltr"
                />
              </div>
            </motion.div>

            {/* Quick actions — bubble style */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <BubbleActionCard
                icon={<FileText className="w-6 h-6 text-white" />}
                gradient="linear-gradient(135deg, #1a1a4b 0%, #2a2a66 100%)"
                shadow="rgba(10,61,61,0.2)"
                title="הפוליסות שלי"
                subtitle="צפה בכל הביטוחים, הכיסויים והנתונים שלך"
                badge="מעודכן"
              />
              <BubbleActionCard
                icon={<Lightbulb className="w-6 h-6 text-white" />}
                gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                shadow="rgba(245,158,11,0.2)"
                title="המלצות הסוכן"
                subtitle="המלצות מותאמות אישית לשיפור הכיסוי שלך"
                badge={null}
              />
              <BubbleActionCard
                icon={<MessageCircle className="w-6 h-6 text-white" />}
                gradient="linear-gradient(135deg, #d6157e 0%, #3ba8a8 100%)"
                shadow="rgba(94,198,198,0.2)"
                title="צ'אט עם הסוכן"
                subtitle="שלח הודעה ישירה לסוכן הביטוח שלך"
                badge={null}
              />
            </motion.div>

            {/* Timeline / recent activity section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-sm border"
            >
              <h3 className="text-lg font-bold mb-4 text-[#1a1a4b] flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#ede9fe] flex items-center justify-center">
                  <Clock className="w-4 h-4 text-[#6366f1]" />
                </div>
                פעילות אחרונה
              </h3>
              <div className="space-y-3">
                <TimelineItem
                  icon={<CheckCircle2 className="w-4 h-4 text-[#16a34a]" />}
                  color="#d1fae5"
                  text="האזור האישי שלך מוכן ומחכה לך"
                  subtext="ברגע שהסוכן שלך יבצע פעולות, הן יופיעו כאן"
                  time="עכשיו"
                />
                <TimelineItem
                  icon={<TrendingUp className="w-4 h-4 text-[#1a1a4b]" />}
                  color="#fce7f3"
                  text="תיק הלקוח שלך נפתח בהצלחה"
                  subtext="כל הפוליסות והנתונים שלך מנוהלים כאן"
                  time={customer?.created_at ? new Date(customer.created_at).toLocaleDateString("he-IL") : "—"}
                />
              </div>
            </motion.div>

            {/* Agent recommendation tip */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
            >
              <DisclaimerBanner
                variant="warning"
                text="לפני ביצוע כל פעולה ביטוחית או פיננסית, מומלץ להתייעץ עם סוכן הביטוח שלך. ניתן לשלוח לו הודעה דרך הצ'אט באזור האישי."
              />
            </motion.div>
          </div>
        </TabsContent>

        {/* ══════ Tab: Policies ══════ */}
        <TabsContent value="policies">
          <DisclaimerBanner
            variant="legal"
            text="* נתוני הפוליסות המוצגים הם לצרכי מידע בלבד ואינם מחליפים את תנאי הפוליסה המקוריים. למידע מדויק ומעודכן, יש לפנות לחברת הביטוח או לסוכן."
            className="mb-6"
          />
          <PoliciesTab />
        </TabsContent>

        {/* ══════ Tab: Recommendations ══════ */}
        <TabsContent value="recommendations">
          <DisclaimerBanner
            variant="warning"
            text={'* ההמלצות מבוססות על ניתוח תיק הביטוח שלך ע"י הסוכן. לפני ביצוע כל פעולה, מומלץ לתאם עם הסוכן שלך ולקבל הסבר מפורט.'}
            className="mb-6"
          />
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

        {/* ══════ Tab: AI Assistant ══════ */}
        <TabsContent value="ai">
          <ClientAIChatbot />
        </TabsContent>
      </Tabs>

      {/* ══════ Legal footer ══════ */}
      <LegalFooterDisclaimer />
    </div>
  );
};

/* ─── Sub-components with bubble design ─── */

const BubbleStatCard = ({
  icon, color, bg, label, value,
}: {
  icon: React.ReactNode; color: string; bg: string; label: string; value: string;
}) => (
  <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 text-center hover:shadow-[0_8px_30px_rgba(10,61,61,0.06)] hover:-translate-y-1 transition-all duration-300 group">
    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm" style={{ background: bg, color }}>
      {icon}
    </div>
    <p className="text-3xl font-extrabold text-[#1a1a4b] mb-1">{value}</p>
    <p className="text-xs font-medium text-gray-400">{label}</p>
  </div>
);

const BubbleInfoItem = ({
  icon, iconBg, label, value, valueColor = "#374151", dir,
}: {
  icon: React.ReactNode; iconBg: string; label: string; value: string; valueColor?: string; dir?: string;
}) => (
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: iconBg }}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[11px] text-gray-400">{label}</p>
      <p className="font-medium text-sm truncate" style={{ color: valueColor }} dir={dir}>
        {value}
      </p>
    </div>
  </div>
);

const BubbleActionCard = ({
  icon, gradient, shadow, title, subtitle, badge,
}: {
  icon: React.ReactNode; gradient: string; shadow: string; title: string; subtitle: string; badge: string | null;
}) => (
  <div className="bg-white rounded-[24px] p-6 sm:p-7 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 hover:shadow-[0_12px_40px_rgba(10,61,61,0.08)] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group relative overflow-hidden">
    {/* Subtle bubble accent */}
    <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none -translate-y-1/2 translate-x-1/3"
      style={{ background: gradient }} />

    <div className="flex items-start justify-between mb-4">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
        style={{ background: gradient, boxShadow: `0 6px 20px ${shadow}` }}
      >
        {icon}
      </div>
      {badge && (
        <span className="text-[11px] font-bold tracking-wide bg-[#16a34a] text-white rounded-full px-3 py-1 shadow-sm">
          {badge}
        </span>
      )}
    </div>
    <h4 className="font-extrabold text-lg mb-1.5 text-[#1a1a4b]">{title}</h4>
    <p className="text-sm text-gray-500 leading-relaxed font-medium">{subtitle}</p>
  </div>
);

const TimelineItem = ({
  icon, color, text, subtext, time,
}: {
  icon: React.ReactNode; color: string; text: string; subtext: string; time: string;
}) => (
  <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: color }}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-[#1a1a4b]">{text}</p>
      <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>
    </div>
    <span className="text-[11px] text-gray-400 shrink-0 mt-1">{time}</span>
  </div>
);

export default PersonalAreaDashboard;
