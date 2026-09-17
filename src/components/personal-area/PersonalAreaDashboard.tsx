import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { siteSupabase } from "@/integrations/supabase/site-client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import ChatTab from "./ChatTab";
import ClientAIChatbot from "./ClientAIChatbot";
import DocumentsTab from "./DocumentsTab";
import RequestsPanel from "./RequestsPanel";
import FileTab from "./FileTab";
import { InsbaseConnectCard } from "./InsbaseConnectCard";
import { LegalFooterDisclaimer } from "./DisclaimerBanner";
import { BrandIcon, type BrandIconName } from "@/components/brand/BrandIcon";
import { callTool, disconnect, finishConnect, loadLink, snapshotSummary, type InsbaseLink } from "@/lib/insbase";
import { BODY, GREEN, IVORY, LINE, MUTED, PASTEL_MINT, PASTEL_SAGE, PASTEL_SAND, SAGE_ON_GREEN, TINT_SAGE } from "@/lib/brand";

/**
 * The personal area in the app-mock structure: בית · תיק · פניות · פרופיל,
 * a bottom tab bar on phones and top tabs from 640px.
 *
 * Data: the InsBase link (the customer's real file, insbase.io) drives בית and
 * תיק; requests go to contact_submissions (own rows) and, when linked, also to
 * the agency's service desk through InsBase; the agency CRM record (customers)
 * unlocks the advisor chat and the document list when the visitor's email is
 * on file. Everything else works for any signed-in visitor.
 */

type Customer = { id: string; first_name: string | null; last_name: string | null; email: string | null; phone: string | null; status: string | null; created_at: string };
type MainTab = "home" | "file" | "requests" | "profile";

const MAIN_NAV: { value: MainTab; label: string; icon: BrandIconName }[] = [
  { value: "home", label: "בית", icon: "home" },
  { value: "file", label: "תיק", icon: "folder" },
  { value: "requests", label: "פניות", icon: "message" },
  { value: "profile", label: "פרופיל", icon: "user" },
];

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("he-IL");

const PersonalAreaDashboard = () => {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState<MainTab>("home");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [link, setLink] = useState<InsbaseLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [requestSubject, setRequestSubject] = useState<string | null>(null);
  const [assistant, setAssistant] = useState(false);

  // Lift the floating launchers above the phone tab bar while this screen is open.
  useEffect(() => {
    document.documentElement.classList.add("pa-open");
    return () => document.documentElement.classList.remove("pa-open");
  }, []);

  // Boot: finish an InsBase callback if we are returning from it, then load the link and the CRM record.
  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      try {
        const linked = await finishConnect(user.id);
        if (linked) { toast.success("התיק חובר. ברוכים הבאים."); setTab("file"); }
      } catch {
        toast.error("החיבור לא הושלם. נסו שוב.");
      }
      // The CRM record, by email (RLS: a customer reads only their own row).
      const findCustomer = async (): Promise<Customer | null> => {
        if (!user.email) return null;
        try {
          const { data } = await siteSupabase
            .from("customers" as never)
            .select("id, first_name, last_name, email, phone, status, created_at")
            .ilike("email", user.email)
            .maybeSingle();
          return (data as unknown as Customer | null) ?? null;
        } catch {
          return null;
        }
      };
      const [l, c] = await Promise.all([loadLink(user.id), findCustomer()]);
      if (!alive) return;
      setLink(l);
      setCustomer(c);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // The snapshot for the home card, once linked
  useEffect(() => {
    if (!link) { setSnapshot(null); return; }
    let alive = true;
    callTool(link, "portfolio_snapshot").then(({ answer, link: l }) => { if (!alive) return; if (l !== link) setLink(l); setSnapshot(answer.text); }).catch(() => alive && setSnapshot(""));
    return () => { alive = false; };
  }, [link?.access_token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignOut = async () => {
    await signOut();
    toast.success("התנתקתם מהאזור האישי.");
  };

  const handleDisconnect = async () => {
    if (!user) return;
    await disconnect(user.id);
    setLink(null);
    toast.success("התיק נותק מהאזור האישי. הגישה מאינסבייס לא נמחקה; הסוכנות יכולה לבטלה לבקשתכם.");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" aria-busy="true" aria-live="polite">
        <Loader2 className="w-8 h-8 animate-spin text-[#003D30]" aria-hidden="true" />
        <span className="sr-only">טוען את התיק</span>
      </div>
    );
  }

  const displayName =
    (snapshot ? snapshotSummary(snapshot).title.replace(/^תמונת מצב\s*[—-]\s*/, "") : "") ||
    [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") ||
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split("@")[0] || "";

  const tiles: { title: string; desc: string; icon: BrandIconName; tint: string; go: () => void }[] = [
    { title: "הביטוחים שלי", desc: link ? "כיסויים, סכומים ותשלומים" : "יופיעו אחרי חיבור התיק", icon: "shield", tint: PASTEL_SAND, go: () => setTab("file") },
    { title: "הכסף שלי", desc: link ? "צבירות, דמי ניהול ונזילות" : "יופיעו אחרי חיבור התיק", icon: "leaf", tint: PASTEL_SAGE, go: () => setTab("file") },
    { title: "מסמכים", desc: customer ? "הקבצים שנקלטו לתיק" : "שליחת מסמכים ליועץ", icon: "document", tint: PASTEL_MINT, go: () => { setRequestSubject("שליחת מסמך"); setTab("requests"); } },
    { title: "פניות", desc: "שאלה, עדכון פרטים או בקשה", icon: "message", tint: PASTEL_SAGE, go: () => setTab("requests") },
  ];

  const nextAction = !link
    ? { title: "חיבור התיק", body: "כדי לראות כאן את הפוליסות, הצבירות והכיסויים, חברו את התיק עם תעודת הזהות והקוד האישי מהסוכנות.", cta: "חיבור התיק", go: () => setTab("file") }
    : { title: "עדכון מסמכים", body: "כדי שנוכל להמשיך לקדם את התיק, שלחו לנו מסמכים חדשים או עדכונים ברגע שיש.", cta: "שליחת מסמך", go: () => { setRequestSubject("שליחת מסמך"); setTab("requests"); } };

  const profileRows: { label: string; value: string | null | undefined; ltr?: boolean }[] = [
    { label: "שם מלא", value: displayName },
    { label: "אימייל", value: user?.email, ltr: true },
    { label: "טלפון", value: customer?.phone, ltr: true },
    { label: "התיק באינסבייס", value: link ? `מחובר מ-${formatDate(link.connected_at)}` : "לא מחובר" },
    { label: "רשומה בסוכנות", value: customer ? `קיימת · נפתחה ${formatDate(customer.created_at)}` : "לא אותרה לפי האימייל" },
  ];

  const TabBar = ({ bottom }: { bottom?: boolean }) => (
    <nav
      aria-label="ניווט האזור האישי"
      className={bottom
        ? "fixed inset-x-0 bottom-0 z-40 border-t bg-white sm:hidden"
        : "hidden sm:flex items-center gap-2 border-b mb-8"}
      style={bottom ? { borderColor: LINE, paddingBottom: "env(safe-area-inset-bottom, 0px)" } : { borderColor: LINE }}
    >
      <div className={bottom ? "grid grid-cols-4" : "flex gap-2"}>
        {MAIN_NAV.map((item) => {
          const active = tab === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setTab(item.value)}
              aria-current={active ? "page" : undefined}
              className={bottom
                ? "flex min-h-[60px] flex-col items-center justify-center gap-1 text-[13px] font-bold"
                : "flex min-h-[48px] items-center gap-2 px-2 pb-3 text-[16px] font-bold border-b-2 -mb-px transition-colors"}
              style={active ? { color: GREEN, borderColor: GREEN } : { color: "#476356", borderColor: "transparent" }}
            >
              <BrandIcon name={item.icon} size={bottom ? 22 : 20} />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );

  return (
    <div dir="rtl" className="pb-20 sm:pb-0">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <h2 className="text-[26px] sm:text-[30px] leading-tight" style={{ color: GREEN }}>
            {tab === "home" ? "התיק שלי" : tab === "file" ? "התיק שלי" : tab === "requests" ? "הפניות שלי" : "הפרופיל שלי"}
          </h2>
          <p className="mt-1 text-[16px]" style={{ color: MUTED }}>{displayName ? `שלום, ${displayName}` : "ברוכים הבאים לאזור האישי"}</p>
        </div>
        <button type="button" onClick={handleSignOut} className="link-rule text-[15px] self-start sm:self-auto">
          <BrandIcon name="close" size={16} />
          התנתקות
        </button>
      </div>

      <TabBar />

      {/* ── בית ── */}
      {tab === "home" && (
        <div className="space-y-5">
          {/* The overview card (mock "מבט כללי") */}
          {link ? (
            <div className="dna-navy-band relative overflow-hidden rounded-2xl p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <BrandIcon name="chart" size={22} style={{ color: SAGE_ON_GREEN }} />
                <h3 className="text-[20px] leading-tight" style={{ color: IVORY }}>מבט כללי</h3>
              </div>
              {snapshot === null ? (
                <p className="mt-3 text-[15px]" style={{ color: SAGE_ON_GREEN }}>מביאים את תמונת המצב מהתיק.</p>
              ) : snapshot === "" ? (
                <p className="mt-3 text-[15px]" style={{ color: SAGE_ON_GREEN }}>תמונת המצב לא נטענה. נסו לרענן.</p>
              ) : (
                <p className="mt-3 text-[16px] leading-[1.7] tabular-nums" style={{ color: IVORY }}>{snapshotSummary(snapshot).summary}</p>
              )}
              <button type="button" onClick={() => setTab("file")} className="btn-on-green-outline mt-5 w-full sm:w-auto">
                לתמונת המצב המלאה
                <BrandIcon name="arrow-left" size={18} />
              </button>
            </div>
          ) : (
            <InsbaseConnectCard compact />
          )}

          {/* Four tiles */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {tiles.map((t) => (
              <button
                key={t.title}
                type="button"
                onClick={t.go}
                className="group flex flex-col items-start rounded-2xl bg-white border p-4 text-start dna-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003D30]"
                style={{ borderColor: LINE }}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: t.tint }}>
                  <BrandIcon name={t.icon} size={22} style={{ color: GREEN }} />
                </span>
                <span className="mt-3 text-[17px] font-bold leading-tight" style={{ color: GREEN }}>{t.title}</span>
                <span className="mt-1 text-[14px] leading-[1.5]" style={{ color: MUTED }}>{t.desc}</span>
                <span className="mt-2 inline-flex items-center gap-1 text-[14px] font-bold" style={{ color: GREEN }}>
                  <BrandIcon name="arrow-left" size={16} className="transition-transform group-hover:-translate-x-1" />
                </span>
              </button>
            ))}
          </div>

          {/* Next action */}
          <div>
            <h3 className="text-[18px] mb-3" style={{ color: GREEN }}>הפעולה הבאה</h3>
            <div className="rounded-2xl p-5" style={{ background: TINT_SAGE }}>
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white" style={{ boxShadow: `inset 0 0 0 1px ${LINE}` }}>
                  <BrandIcon name="upload" size={20} style={{ color: GREEN }} />
                </span>
                <div className="min-w-0">
                  <p className="text-[17px] font-bold" style={{ color: GREEN }}>{nextAction.title}</p>
                  <p className="mt-1 text-[15px] leading-[1.6]" style={{ color: BODY }}>{nextAction.body}</p>
                </div>
              </div>
              <button type="button" onClick={nextAction.go} className="btn-primary mt-4 w-full sm:w-auto">{nextAction.cta}</button>
            </div>
          </div>

          <p className="text-[14px] leading-[1.6]" style={{ color: MUTED }}>
            המידע באזור האישי מוצג כפי שהוא רשום במקורות, עם מקור ותאריך. הוא אינו ייעוץ. החלטות מקבלים יחד עם הסוכנות.
          </p>
        </div>
      )}

      {/* ── תיק ── */}
      {tab === "file" && (
        <div className="space-y-8">
          <FileTab link={link} onLink={setLink} />
          {customer && (
            <section>
              <h3 className="text-[20px] mb-3" style={{ color: GREEN }}>המסמכים שנקלטו לתיק</h3>
              <DocumentsTab customerId={customer.id} />
            </section>
          )}
        </div>
      )}

      {/* ── פניות ── */}
      {tab === "requests" && (
        <div className="space-y-8">
          <RequestsPanel initialSubject={requestSubject} onSubjectConsumed={() => setRequestSubject(null)} link={link} />
          <section className="rounded-2xl bg-white border p-5 sm:p-6" style={{ borderColor: LINE }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-[18px] leading-tight" style={{ color: GREEN }}>היועץ הדיגיטלי</h3>
                <p className="mt-1 text-[14px]" style={{ color: MUTED }}>שאלות כלליות על ביטוח, פנסיה וחיסכון. לא נתון אישי ולא ייעוץ.</p>
              </div>
              <button type="button" onClick={() => setAssistant((v) => !v)} className="btn-secondary w-full sm:w-auto" aria-expanded={assistant}>
                {assistant ? "סגירה" : "פתיחת שיחה"}
              </button>
            </div>
            {assistant && <div className="mt-5"><ClientAIChatbot /></div>}
          </section>
          {customer && (
            <section>
              <h3 className="text-[18px] mb-3" style={{ color: GREEN }}>הודעות עם היועץ</h3>
              <ChatTab customerId={customer.id} customerName={displayName || "לקוח"} />
            </section>
          )}
        </div>
      )}

      {/* ── פרופיל ── */}
      {tab === "profile" && (
        <div className="space-y-5">
          <div className="rounded-2xl bg-white border p-5 sm:p-6" style={{ borderColor: LINE }}>
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
            <p className="mt-4 text-[14px]" style={{ color: MUTED }}>עדכון פרטים נעשה דרך פנייה, כדי שהתיק והפוליסות יישארו תואמים.</p>
          </div>

          <div className="rounded-2xl p-5 sm:p-6" style={{ background: TINT_SAGE }}>
            <h3 className="text-[18px]" style={{ color: GREEN }}>החיבור לאינסבייס</h3>
            {link ? (
              <>
                <p className="mt-1 text-[15px] leading-[1.6]" style={{ color: BODY }}>
                  התיק מחובר מ-{formatDate(link.connected_at)}. הניתוק מוחק את מפתחות הגישה מהאזור האישי; כדי לבטל את הגישה גם באינסבייס, פנו לסוכנות.
                </p>
                <button type="button" onClick={handleDisconnect} className="btn-secondary mt-4 w-full sm:w-auto">ניתוק התיק</button>
              </>
            ) : (
              <>
                <p className="mt-1 text-[15px] leading-[1.6]" style={{ color: BODY }}>התיק עדיין לא מחובר. החיבור נעשה עם תעודת זהות והקוד האישי מהסוכנות.</p>
                <button type="button" onClick={() => setTab("file")} className="btn-primary mt-4 w-full sm:w-auto">חיבור התיק</button>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={() => setTab("requests")} className="btn-primary sm:min-w-[200px]">כתבו לנו</button>
            <button type="button" onClick={handleSignOut} className="btn-secondary sm:min-w-[200px]">התנתקות</button>
            <Link to="/" className="link-rule self-center text-[15px]">לאתר</Link>
          </div>
        </div>
      )}

      <LegalFooterDisclaimer />
      <TabBar bottom />
    </div>
  );
};

export default PersonalAreaDashboard;
