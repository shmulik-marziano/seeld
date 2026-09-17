import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { callTool, type InsbaseLink } from "@/lib/insbase";
import { BODY, GREEN, LINE, MUTED, PASTEL_MINT, PASTEL_SAGE, PASTEL_SAND, TINT_SAGE } from "@/lib/brand";

/**
 * "הפניות שלי" + "פנייה חדשה" (app mock): the signed-in visitor's requests to
 * the agency, with a status chip each, and a short form to open a new one.
 * Backed by contact_submissions (insert: anyone; read: own rows by user_id;
 * status column added 2026-09-17). Attachments go through WhatsApp for now:
 * the site has no customer file storage yet, and the form says so.
 */

type Request = {
  id: string;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
};

const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  received: { label: "התקבל", bg: PASTEL_SAGE, fg: GREEN },
  in_progress: { label: "בטיפול", bg: PASTEL_MINT, fg: GREEN },
  waiting_docs: { label: "ממתין למסמך", bg: PASTEL_SAND, fg: "#8A6230" },
  done: { label: "הושלם", bg: "#E8EDE5", fg: "#476356" },
};

export const REQUEST_SUBJECTS = [
  "עריכת פרטים",
  "בדיקת תיק",
  "שליחת מסמך",
  "שאלה על פוליסה",
  "שאלה על חיסכון או פנסיה",
  "תיאום פגישה",
  "אחר",
];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });

type Filter = "all" | "open" | "done";

const chip = (active: boolean) =>
  `inline-flex min-h-[44px] items-center rounded-full px-4 text-[15px] font-bold transition-colors ${active ? "text-[#FAF7EF]" : "bg-white hover:bg-[#EEF2EC]"}`;

const RequestsPanel = ({ initialSubject, onSubjectConsumed, link }: { initialSubject?: string | null; onSubjectConsumed?: () => void; link?: InsbaseLink | null }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [composing, setComposing] = useState(false);
  const [subject, setSubject] = useState(REQUEST_SUBJECTS[0]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialSubject) {
      setSubject(initialSubject);
      setComposing(true);
      onSubjectConsumed?.();
    }
  }, [initialSubject, onSubjectConsumed]);

  const load = async () => {
    if (!user) return;
    try {
      const { data, error: err } = await supabase
        .from("contact_submissions")
        .select("id, subject, message, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (err) throw err;
      setRequests((data ?? []) as unknown as Request[]);
    } catch {
      toast.error("טעינת הפניות לא הצליחה. נסו לרענן את העמוד.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending || !user) return;
    if (message.trim().length < 3) { setError("כתבו במה נוכל לעזור."); return; }
    setError(null);
    setSending(true);
    try {
      const name = (user.user_metadata?.full_name as string | undefined) || user.email?.split("@")[0] || "לקוח";
      const { error: err } = await supabase.from("contact_submissions").insert([{
        user_id: user.id,
        name,
        email: user.email ?? `${user.id}@lead.seeld.co.il`,
        subject,
        message: `[אזור אישי] ${message.trim()}`,
      }]);
      if (err) throw err;
      // When the file is linked, the request also opens on the agency's service desk in InsBase.
      if (link) {
        try { await callTool(link, "open_service_request", { question: `${subject}: ${message.trim()}` }); } catch { /* the local record stands */ }
      }
      try {
        await supabase.functions.invoke("send-lead-notification", {
          body: { type: "contact", leadData: { fullName: name, email: user.email ?? "", phone: "", insuranceType: subject, message: message.trim() } },
        });
      } catch { /* non-blocking */ }
      setMessage("");
      setComposing(false);
      toast.success("הפנייה נשלחה. נחזור אליכם ביום העסקים הבא.");
      await load();
    } catch {
      toast.error("השליחה לא עברה. נסו שוב, או חייגו 052-309-7444.");
    } finally {
      setSending(false);
    }
  };

  const shown = requests.filter((r) =>
    filter === "all" ? true : filter === "done" ? r.status === "done" : r.status !== "done",
  );

  return (
    <div className="space-y-6">
      {/* New request */}
      {composing ? (
        <form onSubmit={send} className="rounded-2xl bg-white border p-5 sm:p-6" style={{ borderColor: LINE }}>
          <h3 className="text-[22px] leading-tight" style={{ color: GREEN }}>פנייה חדשה</h3>
          <div className="mt-5">
            <label htmlFor="req-subject" className="block text-[14px] font-bold mb-1.5" style={{ color: GREEN }}>נושא</label>
            <select id="req-subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="field appearance-none cursor-pointer">
              {REQUEST_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="mt-4">
            <label htmlFor="req-message" className="block text-[14px] font-bold mb-1.5" style={{ color: GREEN }}>פירוט</label>
            <textarea
              id="req-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="במה נוכל לעזור?"
              className="field resize-y"
              aria-invalid={error ? "true" : undefined}
              aria-describedby={error ? "req-message-err" : undefined}
            />
            {error && <p id="req-message-err" className="mt-1.5 text-[14px]" style={{ color: "#9A4520" }}>{error}</p>}
          </div>
          <div className="mt-4 rounded-2xl border border-dashed p-4 text-[14px] leading-[1.6]" style={{ borderColor: LINE, color: MUTED }}>
            <span className="font-bold" style={{ color: GREEN }}>צירוף מסמך: </span>
            עד שהחיבור לתיק יושלם, קבצים נשלחים ליועץ ב
            <a href="https://wa.me/972523097444" target="_blank" rel="noopener noreferrer" className="font-bold underline underline-offset-4" style={{ color: GREEN }} dir="ltr">WhatsApp</a>
            . ציינו כאן מה שלחתם.
          </div>
          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <button type="submit" disabled={sending} className="btn-primary w-full sm:w-auto sm:min-w-[200px]">
              {sending ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : "שליחת פנייה"}
            </button>
            <button type="button" onClick={() => setComposing(false)} className="btn-secondary w-full sm:w-auto">ביטול</button>
          </div>
          <p className="mt-3 text-[14px]" style={{ color: MUTED }}>אישור קבלה יופיע ברשימה מיד לאחר השליחה.</p>
        </form>
      ) : (
        <button type="button" onClick={() => setComposing(true)} className="btn-primary w-full sm:w-auto sm:min-w-[220px]">
          <BrandIcon name="message" size={18} />
          פנייה חדשה
        </button>
      )}

      {/* The list */}
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-[20px] leading-tight" style={{ color: GREEN }}>הפניות שלי</h3>
          <div className="flex flex-wrap gap-2" role="group" aria-label="סינון פניות">
            {([["all", "הכל"], ["open", "בטיפול"], ["done", "הושלם"]] as [Filter, string][]).map(([v, l]) => (
              <button key={v} type="button" onClick={() => setFilter(v)} aria-pressed={filter === v} className={chip(filter === v)} style={filter === v ? { background: GREEN } : { color: GREEN, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10" aria-busy="true"><Loader2 className="w-6 h-6 animate-spin" style={{ color: GREEN }} aria-hidden="true" /></div>
        ) : shown.length === 0 ? (
          <div className="rounded-2xl p-6" style={{ background: TINT_SAGE }}>
            <p className="text-[17px] font-bold" style={{ color: GREEN }}>
              {requests.length === 0 ? "עדיין אין פניות" : "אין פניות בסינון הזה"}
            </p>
            <p className="mt-1 text-[15px] leading-[1.6]" style={{ color: BODY }}>
              {requests.length === 0 ? "כל פנייה שתשלחו מכאן תופיע ברשימה עם מצב הטיפול שלה." : "נסו סינון אחר."}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {shown.map((r) => {
              const st = STATUS[r.status] ?? STATUS.received;
              return (
                <li key={r.id} className="flex items-start gap-4 rounded-2xl bg-white border p-4" style={{ borderColor: LINE }}>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ background: PASTEL_SAGE }}>
                    <BrandIcon name="document" size={20} style={{ color: GREEN }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h4 className="text-[17px] font-bold leading-tight" style={{ color: GREEN }}>{r.subject || "פנייה"}</h4>
                      <span className="rounded-full px-2.5 py-0.5 text-[13px] font-bold" style={{ background: st.bg, color: st.fg }}>{st.label}</span>
                    </div>
                    <p className="mt-1 text-[14px] tabular-nums" style={{ color: MUTED }}>{formatDate(r.created_at)}</p>
                    <p className="mt-1.5 text-[15px] leading-[1.6] line-clamp-2" style={{ color: BODY }}>{r.message.replace(/^\[אזור אישי\]\s*/, "")}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RequestsPanel;
