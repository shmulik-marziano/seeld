import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { siteSupabase } from "@/integrations/supabase/site-client";
import { toast } from "sonner";
import ChatTab from "./ChatTab";
import ClientAIChatbot from "./ClientAIChatbot";
import DocumentsTab from "./DocumentsTab";
import RequestsPanel from "./RequestsPanel";
import FileTab from "./FileTab";
import { InsbaseConnectCard } from "./InsbaseConnectCard";
import { LegalFooterDisclaimer } from "./DisclaimerBanner";
import { BrandIcon, type BrandIconName } from "@/components/brand/BrandIcon";
import { SdIcon, SdPic } from "@/components/sd/primitives";
import { CaLoading } from "@/components/sd/client";
import type { Pastel } from "@/components/sd/topics";
import { callTool, disconnect, finishConnect, loadLink, snapshotSummary, type InsbaseLink } from "@/lib/insbase";
import { BODY, GREEN, LINE, MUTED } from "@/lib/brand";

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
    toast.success("התיק נותק מהאזור האישי. הגישה מאינסבייס לא נמחקה; אנחנו יכולים לבטלה לבקשתכם.");
  };

  if (loading) {
    return <CaLoading label="טוען את התיק" tone="sky" />;
  }

  const displayName =
    (snapshot ? snapshotSummary(snapshot).title.replace(/^תמונת מצב\s*[—-]\s*/, "") : "") ||
    [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") ||
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split("@")[0] || "";

  const tiles: { title: string; desc: string; icon: string; tone: Pastel; go: () => void }[] = [
    { title: "הביטוחים שלי", desc: link ? "כיסויים, סכומים ותשלומים" : "יופיעו אחרי חיבור התיק", icon: "shield", tone: "butter", go: () => setTab("file") },
    { title: "הכסף שלי", desc: link ? "צבירות, דמי ניהול ונזילות" : "יופיעו אחרי חיבור התיק", icon: "wallet", tone: "sage", go: () => setTab("file") },
    { title: "מסמכים", desc: customer ? "הקבצים שנקלטו לתיק" : "שליחת מסמכים לצוות", icon: "document", tone: "sky", go: () => { setRequestSubject("שליחת מסמך"); setTab("requests"); } },
    { title: "פניות", desc: "שאלה, עדכון פרטים או בקשה", icon: "support", tone: "rose", go: () => setTab("requests") },
  ];

  const nextAction = !link
    ? { title: "חיבור התיק", body: "כדי לראות כאן את הפוליסות, הצבירות והכיסויים, חברו את התיק עם תעודת הזהות והקוד האישי שקיבלתם מאיתנו.", cta: "חיבור התיק", go: () => setTab("file") }
    : { title: "עדכון מסמכים", body: "כדי שנוכל להמשיך לקדם את התיק, שלחו לנו מסמכים חדשים או עדכונים ברגע שיש.", cta: "שליחת מסמך", go: () => { setRequestSubject("שליחת מסמך"); setTab("requests"); } };

  const profileRows: { label: string; value: string | null | undefined; ltr?: boolean }[] = [
    { label: "שם מלא", value: displayName },
    { label: "אימייל", value: user?.email, ltr: true },
    { label: "טלפון", value: customer?.phone, ltr: true },
    { label: "התיק באינסבייס", value: link ? `מחובר מ-${formatDate(link.connected_at)}` : "לא מחובר" },
    { label: "רשומה בסוכנות", value: customer ? `קיימת · נפתחה ${formatDate(customer.created_at)}` : "לא אותרה לפי האימייל" },
  ];

  const TabBar = ({ bottom }: { bottom?: boolean }) => (
    <nav aria-label="ניווט האזור האישי" className={bottom ? "sd-ca-bottombar" : "sd-ca-tabs"}>
      <div style={bottom ? undefined : { display: "contents" }}>
        {MAIN_NAV.map((item) => (
          <button key={item.value} type="button" onClick={() => setTab(item.value)} aria-current={tab === item.value ? "page" : undefined}>
            <BrandIcon name={item.icon} size={bottom ? 22 : 20} />
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );

  return (
    <div dir="rtl" className="pb-20 sm:pb-0">
      {/* Greeting */}
      <div className="sd-ca-greet">
        <div>
          <h2>
            {tab === "home" ? "התיק שלי" : tab === "file" ? "התיק שלי" : tab === "requests" ? "הפניות שלי" : "הפרופיל שלי"}
          </h2>
          <p>{displayName ? `שלום, ${displayName}` : "ברוכים הבאים לאזור האישי"}</p>
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
          {link ? (
            <section className="sd-ca-panel has-stripe sd-ca-tone-sky">
              <div className="sd-ca-panel-head">
                <SdIcon name="chart" size={44} />
                <h3>מבט כללי</h3>
              </div>
              {snapshot === null ? (
                <div className="mt-4"><CaLoading label="מביאים את תמונת המצב מהתיק" tone="sky" /></div>
              ) : snapshot === "" ? (
                <p className="mt-3 text-[16px]" style={{ color: MUTED }}>תמונת המצב לא נטענה. נסו לרענן.</p>
              ) : (
                <p className="mt-3 text-[17px] leading-[1.75] tabular-nums" style={{ color: BODY }}>{snapshotSummary(snapshot).summary}</p>
              )}
              <button type="button" onClick={() => setTab("file")} className="btn-primary mt-5 w-full sm:w-auto">
                לתמונת המצב המלאה
                <BrandIcon name="arrow-left" size={18} />
              </button>
            </section>
          ) : (
            <InsbaseConnectCard compact />
          )}

          <div className="sd-ca-tiles">
            {tiles.map((t) => (
              <button key={t.title} type="button" onClick={t.go} className={`sd-ca-tile sd-ca-tone-${t.tone}`}>
                <span className="sd-ca-tile-ic" aria-hidden="true"><SdIcon name={t.icon} size={32} /></span>
                <b>{t.title}</b>
                <span className="d">{t.desc}</span>
                <span className="go" aria-hidden="true"><BrandIcon name="arrow-left" size={18} /></span>
              </button>
            ))}
          </div>

          <section className="sd-ca-soft sd-ca-tone-butter">
            <div className="sd-ca-split has-art">
              <div>
                <h3>הצעד הבא: {nextAction.title}</h3>
                <p className="mt-2 text-[16px] leading-[1.75]">{nextAction.body}</p>
                <button type="button" onClick={nextAction.go} className="btn-primary mt-4 w-full sm:w-auto">{nextAction.cta}</button>
              </div>
              <div className="sd-ca-split-art" aria-hidden="true"><SdPic name="11-claims-service" sizes="190px" /></div>
            </div>
          </section>

          <p className="text-[14px] leading-[1.6]" style={{ color: MUTED }}>
            המידע באזור האישי מוצג כפי שהוא רשום במקורות, עם מקור ותאריך. הוא אינו ייעוץ. החלטות מקבלים יחד איתנו.
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
          <section className="sd-ca-panel has-stripe sd-ca-tone-lavender">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3>העוזר הדיגיטלי</h3>
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
              <h3 className="text-[20px] mb-3" style={{ color: GREEN }}>הודעות לצוות שלנו</h3>
              <ChatTab customerId={customer.id} customerName={displayName || "לקוח"} />
            </section>
          )}
        </div>
      )}

      {/* ── פרופיל ── */}
      {tab === "profile" && (
        <div className="space-y-5">
          <div className="sd-ca-panel has-stripe sd-ca-tone-sage">
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

          <div className="sd-ca-soft sd-ca-tone-sky">
            <h3>החיבור לאינסבייס</h3>
            {link ? (
              <>
                <p className="mt-1 text-[15px] leading-[1.6]" style={{ color: BODY }}>
                  התיק מחובר מ-{formatDate(link.connected_at)}. הניתוק מוחק את מפתחות הגישה מהאזור האישי; כדי לבטל את הגישה גם באינסבייס, פנו אלינו.
                </p>
                <button type="button" onClick={handleDisconnect} className="btn-secondary mt-4 w-full sm:w-auto">ניתוק התיק</button>
              </>
            ) : (
              <>
                <p className="mt-1 text-[15px] leading-[1.6]" style={{ color: BODY }}>התיק עדיין לא מחובר. החיבור נעשה עם תעודת זהות והקוד האישי שקיבלתם מאיתנו.</p>
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
