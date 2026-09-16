import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { siteSupabase } from "@/integrations/supabase/site-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import PoliciesTab from "./PoliciesTab";
import RecommendationsTab from "./RecommendationsTab";
import DocumentsTab from "./DocumentsTab";
import ChatTab from "./ChatTab";
import ClientAIChatbot from "./ClientAIChatbot";
import DisclaimerBanner, { LegalFooterDisclaimer } from "./DisclaimerBanner";
import { Illustration } from "@/components/brand/Illustration";
import { BrandIcon, type BrandIconName } from "@/components/brand/BrandIcon";
import { BODY, GREEN, LINE, MUTED } from "@/lib/brand";

type Customer = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  created_at: string;
};

// The personal area is not launched yet: design and interface are in place,
// but live customer data stays disconnected until the flow is production-ready
// (user decision 2026-07-20). Flip to true to reconnect email-based lookup.
const PERSONAL_AREA_LIVE = false;

// Kit navigation, right to left: בית · תיק · פניות · פרופיל.
// Insurance, documents and the advisor's recommendations sit under תיק;
// a message to the advisor (and the digital assistant) under פניות.
type MainTab = "home" | "file" | "requests" | "profile";
type FileSection = "policies" | "recommendations" | "documents";
type RequestSection = "agent" | "assistant";

const MAIN_NAV: { value: MainTab; label: string; icon: BrandIconName }[] = [
  { value: "home", label: "בית", icon: "home" },
  { value: "file", label: "תיק", icon: "folder" },
  { value: "requests", label: "פניות", icon: "message" },
  { value: "profile", label: "פרופיל", icon: "user" },
];

const FILE_NAV: { value: FileSection; label: string }[] = [
  { value: "policies", label: "ביטוחים וחיסכון" },
  { value: "recommendations", label: "המלצות" },
  { value: "documents", label: "מסמכים" },
];

const REQUEST_NAV: { value: RequestSection; label: string }[] = [
  { value: "agent", label: "הודעה ליועץ" },
  { value: "assistant", label: "היועץ הדיגיטלי" },
];

const mainTabClass =
  "flex items-center gap-2 rounded-none bg-transparent px-1 pt-2 pb-3 min-h-[48px] text-[16px] font-bold text-[#476356] border-b-2 border-transparent data-[state=active]:border-[#003D30] data-[state=active]:text-[#003D30] data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors whitespace-nowrap";

const statusLabel = (status: string | null) => {
  if (status === "active") return "תיק פעיל";
  if (status === "lead") return "בתהליך פתיחה";
  return status || "תיק פעיל";
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("he-IL");

const PersonalAreaDashboard = () => {
  const { user, signOut } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<MainTab>("home");
  const [fileSection, setFileSection] = useState<FileSection>("policies");
  const [requestSection, setRequestSection] = useState<RequestSection>("agent");

  useEffect(() => {
    if (!PERSONAL_AREA_LIVE) {
      setNotFound(true);
      setLoading(false);
      return;
    }
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
    toast.success("התנתקתם מהאזור האישי.");
  };

  const openFile = (section: FileSection) => {
    setFileSection(section);
    setTab("file");
  };
  const openRequests = (section: RequestSection) => {
    setRequestSection(section);
    setTab("requests");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" aria-busy="true" aria-live="polite">
        <Loader2 className="w-8 h-8 animate-spin text-[#003D30]" aria-hidden="true" />
        <span className="sr-only">טוען את התיק</span>
      </div>
    );
  }

  // ── No active file yet: the one screen every signed-in visitor sees today ──
  if (notFound) {
    return (
      <div dir="rtl" className="dna-concept !p-6 sm:!p-10">
        <div className="grid gap-8 md:grid-cols-[1fr_280px] items-center">
          <div>
            <h2 className="text-[24px] sm:text-[28px] leading-tight" style={{ color: GREEN }}>
              עדיין אין תיק פעיל בכניסה הזו
            </h2>
            <p className="mt-3 text-[17px] leading-[1.7]" style={{ color: BODY }}>
              כדי לפתוח תיק אישי ולראות כאן את הפוליסות, החיסכון והמסמכים, דברו עם היועץ.
              אפשר להתחיל בבדיקת תיק 360 ללא עלות.
            </p>
            {user?.email && (
              <p className="mt-3 text-[14px]" style={{ color: MUTED }}>
                מחוברים עם{" "}
                <span className="font-bold whitespace-nowrap" style={{ color: GREEN }} dir="ltr">{user.email}</span>
              </p>
            )}
            <div className="mt-7 flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <Link to="/contact" className="btn-primary sm:min-w-[200px]">
                תיאום פגישה
              </Link>
              <a
                href="https://wa.me/972523097444"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary sm:min-w-[200px]"
              >
                <span>הודעה ב</span>
                <span dir="ltr">WhatsApp</span>
              </a>
            </div>
            <button type="button" onClick={handleSignOut} className="link-rule mt-6 text-[15px]">
              <BrandIcon name="close" size={16} />
              התנתקות
            </button>
          </div>
          <Illustration
            name="06-documents-service"
            sizes="(min-width: 768px) 280px, 60vw"
            className="max-w-[280px] mx-auto"
          />
        </div>
      </div>
    );
  }

  const fullName = [customer?.first_name, customer?.last_name].filter(Boolean).join(" ");
  const displayName =
    fullName || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";

  const profileRows: { label: string; value: string | null | undefined; ltr?: boolean }[] = [
    { label: "שם מלא", value: fullName || user?.user_metadata?.full_name },
    { label: "אימייל", value: customer?.email || user?.email, ltr: true },
    { label: "טלפון", value: customer?.phone, ltr: true },
    { label: "מצב התיק", value: customer ? statusLabel(customer.status) : null },
    { label: "התיק נפתח", value: customer?.created_at ? formatDate(customer.created_at) : null },
  ];

  const SubNav = <T extends string>({
    items, value, onChange, label,
  }: { items: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) => (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-2 mb-6">
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className="min-h-[44px] px-4 rounded-full text-[15px] font-bold border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003D30]"
            style={
              active
                ? { backgroundColor: GREEN, color: "#FAF7EF", borderColor: GREEN }
                : { backgroundColor: "#FFFFFF", color: GREEN, borderColor: LINE }
            }
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div dir="rtl">
      {/* ── Greeting ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[24px] sm:text-[28px] leading-tight" style={{ color: GREEN }}>
            {displayName ? `שלום, ${displayName}` : "שלום"}
          </h2>
          <p className="mt-1 text-[16px]" style={{ color: MUTED }}>
            {customer ? `${statusLabel(customer.status)} · נפתח בתאריך ${formatDate(customer.created_at)}` : "ברוכים הבאים לאזור האישי"}
          </p>
        </div>
        <button type="button" onClick={handleSignOut} className="link-rule text-[15px] self-start sm:self-auto">
          <BrandIcon name="close" size={16} />
          התנתקות
        </button>
      </div>

      {/* ── Main navigation: בית · תיק · פניות · פרופיל ── */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as MainTab)} dir="rtl">
        <TabsList
          className="flex w-full justify-start gap-6 sm:gap-8 h-auto bg-transparent p-0 mb-8 border-b rounded-none overflow-x-auto scrollbar-hide"
          style={{ borderColor: LINE }}
          aria-label="ניווט האזור האישי"
        >
          {MAIN_NAV.map((item) => (
            <TabsTrigger key={item.value} value={item.value} className={mainTabClass}>
              <BrandIcon name={item.icon} size={20} />
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── בית ── */}
        <TabsContent value="home" className="mt-0 space-y-6">
          <DisclaimerBanner
            variant="info"
            text="המידע באזור האישי הוא לצורכי מידע כללי ואינו מחליף ייעוץ מקצועי. לפני כל פעולה, מומלץ להתייעץ עם היועץ."
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {([
              { title: "הביטוחים והחיסכון", desc: "כל הפוליסות והחסכונות שבתיק, עם החברה, המספר והסכומים.", icon: "shield" as BrandIconName, go: () => openFile("policies") },
              { title: "המסמכים", desc: "הקבצים שהתקבלו לתיק ומצב הבדיקה של כל אחד.", icon: "document" as BrandIconName, go: () => openFile("documents") },
              { title: "פנייה ליועץ", desc: "כתבו ליועץ. התשובה נשמרת כאן, בשיחה אחת.", icon: "message" as BrandIconName, go: () => openRequests("agent") },
            ]).map((door) => (
              <button
                key={door.title}
                type="button"
                onClick={door.go}
                className="group dna-concept dna-hover text-start h-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003D30]"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <BrandIcon name={door.icon} size={28} style={{ color: GREEN }} />
                    <h3 className="text-[18px]" style={{ color: GREEN }}>{door.title}</h3>
                  </div>
                  <BrandIcon name="arrow-left" size={18} className="shrink-0 mt-1 transition-transform group-hover:-translate-x-1" style={{ color: GREEN }} />
                </div>
                <p className="text-[15px] leading-[1.6]" style={{ color: BODY }}>{door.desc}</p>
              </button>
            ))}
          </div>

          <div className="dna-concept">
            <h3 className="text-[18px] mb-4" style={{ color: GREEN }}>הפרטים בתיק</h3>
            <dl className="border-t" style={{ borderColor: LINE }}>
              {profileRows.slice(0, 3).map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-4 py-3 border-b" style={{ borderColor: LINE }}>
                  <dt className="text-[14px]" style={{ color: MUTED }}>{row.label}</dt>
                  <dd className="text-[16px] font-bold text-left" style={{ color: row.value ? GREEN : MUTED }} dir={row.value && row.ltr ? "ltr" : undefined}>
                    {row.value || "לא צוין"}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-[14px]" style={{ color: MUTED }}>
              פרט שגוי או חסר? כתבו ליועץ תחת פניות והוא יעדכן את התיק.
            </p>
          </div>
        </TabsContent>

        {/* ── תיק ── */}
        <TabsContent value="file" className="mt-0">
          <SubNav items={FILE_NAV} value={fileSection} onChange={setFileSection} label="חלקי התיק" />

          {fileSection === "policies" && (
            <div className="space-y-6">
              <DisclaimerBanner
                variant="legal"
                text="נתוני הפוליסות מוצגים לצורכי מידע ואינם מחליפים את תנאי הפוליסה המקוריים. למידע מדויק ומעודכן, פנו לחברת הביטוח או ליועץ."
              />
              <PoliciesTab />
            </div>
          )}

          {fileSection === "recommendations" && (
            <div className="space-y-6">
              <DisclaimerBanner
                variant="warning"
                text="ההמלצות מבוססות על ניתוח התיק על ידי היועץ. לפני ביצוע, מומלץ לעבור עליהן יחד ולקבל הסבר מלא."
              />
              {customer ? (
                <RecommendationsTab customerId={customer.id} />
              ) : (
                <p className="text-[16px]" style={{ color: MUTED }}>ההמלצות יופיעו כאן לאחר שהתיק ייפתח.</p>
              )}
            </div>
          )}

          {fileSection === "documents" && (
            customer ? (
              <DocumentsTab customerId={customer.id} />
            ) : (
              <p className="text-[16px]" style={{ color: MUTED }}>המסמכים יופיעו כאן לאחר שהתיק ייפתח.</p>
            )
          )}
        </TabsContent>

        {/* ── פניות ── */}
        <TabsContent value="requests" className="mt-0">
          <SubNav items={REQUEST_NAV} value={requestSection} onChange={setRequestSection} label="סוגי הפניות" />

          {requestSection === "agent" && (
            customer ? (
              <ChatTab customerId={customer.id} customerName={displayName || "לקוח"} />
            ) : (
              <p className="text-[16px]" style={{ color: MUTED }}>הפנייה ליועץ תיפתח כאן לאחר שהתיק ייפתח.</p>
            )
          )}

          {requestSection === "assistant" && <ClientAIChatbot />}
        </TabsContent>

        {/* ── פרופיל ── */}
        <TabsContent value="profile" className="mt-0 space-y-6">
          <div className="dna-concept">
            <h3 className="text-[18px] mb-4" style={{ color: GREEN }}>הפרופיל שלכם</h3>
            <dl className="border-t" style={{ borderColor: LINE }}>
              {profileRows.map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-4 py-3 border-b" style={{ borderColor: LINE }}>
                  <dt className="text-[14px]" style={{ color: MUTED }}>{row.label}</dt>
                  <dd className="text-[16px] font-bold text-left" style={{ color: row.value ? GREEN : MUTED }} dir={row.value && row.ltr ? "ltr" : undefined}>
                    {row.value || "לא צוין"}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-[14px]" style={{ color: MUTED }}>
              עדכון פרטים נעשה דרך היועץ, כדי שהתיק והפוליסות יישארו תואמים.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={() => openRequests("agent")} className="btn-primary sm:min-w-[200px]">
              כתבו ליועץ
            </button>
            <button type="button" onClick={handleSignOut} className="btn-secondary sm:min-w-[200px]">
              התנתקות
            </button>
          </div>
        </TabsContent>
      </Tabs>

      <LegalFooterDisclaimer />
    </div>
  );
};

export default PersonalAreaDashboard;
