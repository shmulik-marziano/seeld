// Staff tab "שאלונים" of the site admin: the client submissions of the agency (staff.form_submission_list), a row drawer with
// the answers by section (staff.form_submission_get + ResponseViewer), the documents (client-docs function), "סומן כטופל"
// (staff.form_submission_set_status), and a compact view of the POA sessions (staff.poa_session_list: engine, ship state).
// Everything goes through the staff RPCs of the seeld-site project: admin, fresh TOTP, access log on every read.
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { untypedSupabase, SITE_SUPABASE_URL } from "@/integrations/supabase/site-client";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CARD_KEYS, cardOf, DOCUMENT_LABELS, RISK_QUESTIONNAIRE_KEY, type DocumentKind } from "@/forms/catalog";
import { isQuestionnaireKey, loadQuestionnaire } from "@/questionnaires/registry";
import type { Answers, Questionnaire } from "@/questionnaires/types";
import "@/questionnaires/questionnaires.css";

const ResponseViewer = lazy(() => import("@/questionnaires/components/ResponseViewer").then((m) => ({ default: m.ResponseViewer })));

export interface SubmissionRow {
  id: string; session_id: string; card_key: string; questionnaire_key: string; version: number; status: "draft" | "submitted" | "reviewed";
  completion_pct: number; answers_stored: boolean; derived: Record<string, unknown>; first_name: string | null; last_name: string | null;
  id_masked: string; phone_tail: string; created_at: string; updated_at: string; submitted_at: string | null; reviewed_at: string | null;
  documents: { id: string; kind: string; status: string; stored: boolean }[]; session_status: string;
}
export interface SubmissionFull extends Omit<SubmissionRow, "first_name" | "last_name" | "id_masked" | "phone_tail" | "session_status"> {
  answers: Answers; signer: { name?: string; kind?: string; png?: string; hash?: string } | null; signed_at: string | null; review_note: string | null;
  identity: { first_name: string; last_name: string; id_masked: string; phone: string; email: string | null };
  documents: { id: string; kind: string; status: string; stored: boolean; created_at: string }[];
}
export interface PoaRow { id: string; status: string; engine: string | null; ship_status: string | null; ship_error: string | null; shipped_at: string | null; first_name: string | null; last_name: string | null; phone_tail: string; created_at: string; completed_at: string | null; last_error: string | null }

const STATUS_LABEL: Record<SubmissionRow["status"], string> = { draft: "בתהליך", submitted: "נשלח", reviewed: "טופל" };
const STATUS_CLASS: Record<SubmissionRow["status"], string> = { draft: "bg-[#F5EEE0] text-[#7C5C22]", submitted: "bg-[#DFE9DC] text-[#2F6B4E]", reviewed: "bg-[#E8ECF1] text-[#55677C]" };
const SHIP_LABEL: Record<string, string> = { pending: "ממתין לשיגור", shipped: "שוגר לשורנס", failed: "שיגור נכשל" };
const QUESTIONNAIRE_TITLE: Record<string, string> = {
  personal: "פרטים אישיים", health: "בירור בריאותי", "needs-assessment": "בירור צרכים", "occupation-income": "תעסוקה והכנסה",
  "retirement-planning": "תכנון פרישה", "savings-join": "הצטרפות לחיסכון פנסיוני", [RISK_QUESTIONNAIRE_KEY]: "אפיון סיכון",
};
const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" }) : "");

/** staff RPC through the single site connection; the error text is the database's short code */
async function staffRpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await untypedSupabase.schema("staff").rpc(fn, args);
  if (error) throw new Error(error.message || "rpc_failed");
  return data as T;
}
function explain(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e);
  if (/admin_fresh_totp|fresh_totp/.test(m)) return "נדרש אימות דו־שלבי טרי (TOTP) של מנהל כדי לצפות בשאלונים.";
  if (/PGRST202|function .* does not exist|schema/.test(m)) return "הגרסה הזו של האתר עדיין לא מחוברת לשרת השאלונים.";
  if (/JWT|401|unauthenticated/i.test(m)) return "צריך להתחבר מחדש.";
  return `לא הצלחנו לטעון: ${m}`;
}

export default function FormsModule() {
  const [rows, setRows] = useState<SubmissionRow[]>([]);
  const [poa, setPoa] = useState<PoaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [card, setCard] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"updated" | "submitted">("updated");
  const [open, setOpen] = useState<SubmissionRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const [list, poaList] = await Promise.all([
        staffRpc<SubmissionRow[]>("form_submission_list", { p_limit: 200, p_offset: 0, p_card: card || null, p_status: status || null }),
        staffRpc<PoaRow[]>("poa_session_list", { p_limit: 50, p_offset: 0 }).catch(() => [] as PoaRow[]),
      ]);
      setRows(list ?? []);
      setPoa(poaList ?? []);
    } catch (e) {
      setErr(explain(e));
    } finally {
      setLoading(false);
    }
  }, [card, status]);
  useEffect(() => { void load(); }, [load]);

  const shown = useMemo(() => {
    const q = search.trim();
    const list = rows.filter((r) => !q || r.phone_tail.endsWith(q.slice(-2)) || `${r.first_name ?? ""} ${r.last_name ?? ""}`.includes(q) || r.id_masked.endsWith(q.slice(-4)));
    return [...list].sort((a, b) => (sort === "updated" ? b.updated_at.localeCompare(a.updated_at) : (b.submitted_at ?? "").localeCompare(a.submitted_at ?? "")));
  }, [rows, search, sort]);

  const counts = useMemo(() => ({ total: rows.length, submitted: rows.filter((r) => r.status === "submitted").length, draft: rows.filter((r) => r.status === "draft").length }), [rows]);

  return (
    <div dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold text-[#203957]">שאלונים</h2>
          <p className="text-sm text-[#55677C]">{counts.total} שאלונים · {counts.submitted} ממתינים לטיפול · {counts.draft} בתהליך</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={card} onChange={(e) => setCard(e.target.value)} className="h-10 rounded-full border border-[#D9DEE4] px-3 text-sm bg-white" aria-label="סוג שאלון">
            <option value="">כל הסוגים</option>
            {CARD_KEYS.filter((k) => k !== "reports").map((k) => <option key={k} value={k}>{cardOf(k)?.title}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-full border border-[#D9DEE4] px-3 text-sm bg-white" aria-label="סטטוס">
            <option value="">כל הסטטוסים</option>
            <option value="submitted">נשלח</option>
            <option value="draft">בתהליך</option>
            <option value="reviewed">טופל</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as "updated" | "submitted")} className="h-10 rounded-full border border-[#D9DEE4] px-3 text-sm bg-white" aria-label="מיון">
            <option value="updated">לפי עדכון אחרון</option>
            <option value="submitted">לפי מועד שליחה</option>
          </select>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#55677C]" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="שם, 2 ספרות טלפון, 4 ספרות ת״ז" className="pr-10 rounded-full h-10 w-[240px] border-[#D9DEE4]" aria-label="חיפוש" />
          </div>
          <button type="button" onClick={() => void load()} className="h-10 px-4 rounded-full border border-[#D9DEE4] text-sm bg-white hover:bg-[#EEF2EC]">רענון</button>
        </div>
      </div>

      {err && <div className="bg-[#FBEFEA] text-[#9A4520] rounded-xl p-4 mb-4 text-sm" role="alert">{err}</div>}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#203957]" /></div>
      ) : shown.length === 0 && !err ? (
        <div className="bg-white rounded-2xl p-10 border text-center text-[#55677C]">
          <p className="font-bold text-[#203957] mb-1">אין שאלונים להצגה</p>
          <p className="text-sm">כשלקוח ימלא שאלון בעמוד "שאלונים ומסמכים", הוא יופיע כאן.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F7F9F6] text-[#55677C]">
                <tr>
                  <th className="text-right font-medium px-4 py-3">לקוח</th>
                  <th className="text-right font-medium px-4 py-3">שאלון</th>
                  <th className="text-right font-medium px-4 py-3">סטטוס</th>
                  <th className="text-right font-medium px-4 py-3 hidden md:table-cell">השלמה</th>
                  <th className="text-right font-medium px-4 py-3 hidden md:table-cell">מסמכים</th>
                  <th className="text-right font-medium px-4 py-3">עדכון</th>
                  <th className="px-2 py-3"><span className="sr-only">פעולות</span></th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-[#FAFBF8] cursor-pointer" onClick={() => setOpen(r)}>
                    <td className="px-4 py-3">
                      <div className="font-bold text-[#203957]">{[r.first_name, r.last_name].filter(Boolean).join(" ") || "—"}</div>
                      <div className="text-xs text-[#55677C]"><bdi dir="ltr">{r.id_masked}</bdi> · טלפון ··{r.phone_tail}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{QUESTIONNAIRE_TITLE[r.questionnaire_key] ?? r.questionnaire_key}</div>
                      <div className="text-xs text-[#55677C]">{cardOf(r.card_key)?.title ?? r.card_key}{r.questionnaire_key === "health" && !r.answers_stored ? " · רק תוצאת הסינון" : ""}</div>
                    </td>
                    <td className="px-4 py-3"><span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", STATUS_CLASS[r.status])}>{STATUS_LABEL[r.status]}</span></td>
                    <td className="px-4 py-3 hidden md:table-cell"><bdi dir="ltr">{r.completion_pct}%</bdi></td>
                    <td className="px-4 py-3 hidden md:table-cell">{r.documents.length ? `${r.documents.filter((d) => d.stored).length} מתוך ${r.documents.length}` : "—"}</td>
                    <td className="px-4 py-3 text-[#55677C] whitespace-nowrap">{fmt(r.submitted_at ?? r.updated_at)}</td>
                    <td className="px-2 py-3"><button type="button" className="text-[#203957] underline text-xs" onClick={(e) => { e.stopPropagation(); setOpen(r); }}>פתיחה</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PoaPanel rows={poa} />

      {open && <SubmissionDrawer row={open} onClose={() => setOpen(null)} onChanged={() => void load()} />}
    </div>
  );
}

function PoaPanel({ rows }: { rows: PoaRow[] }) {
  if (!rows.length) return null;
  return (
    <section className="mt-8" aria-labelledby="poa-panel-h">
      <h3 id="poa-panel-h" className="text-lg font-bold text-[#203957] mb-2">הזמנת מידעים (ייפויי כוח)</h3>
      <p className="text-sm text-[#55677C] mb-3">המצב של כל הזמנה: השלמה אצלנו, ושיגור לשורנס במנוע העצמי.</p>
      <div className="bg-white rounded-2xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#F7F9F6] text-[#55677C]">
            <tr>
              <th className="text-right font-medium px-4 py-3">לקוח</th>
              <th className="text-right font-medium px-4 py-3">סטטוס</th>
              <th className="text-right font-medium px-4 py-3">מנוע</th>
              <th className="text-right font-medium px-4 py-3">שיגור</th>
              <th className="text-right font-medium px-4 py-3">נוצר</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 20).map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3"><span className="font-bold text-[#203957]">{[r.first_name, r.last_name].filter(Boolean).join(" ") || "—"}</span> <span className="text-xs text-[#55677C]">··{r.phone_tail}</span></td>
                <td className="px-4 py-3">{r.status === "completed" ? "הושלם" : r.status === "open" ? "פתוח" : r.status === "expired" ? "פג תוקף" : r.status}</td>
                <td className="px-4 py-3">{r.engine === "native" ? "עצמי" : r.engine === "surense" ? "שורנס" : "—"}</td>
                <td className="px-4 py-3">
                  {r.ship_status ? <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", r.ship_status === "shipped" ? "bg-[#DFE9DC] text-[#2F6B4E]" : r.ship_status === "failed" ? "bg-[#FBEFEA] text-[#9A4520]" : "bg-[#F5EEE0] text-[#7C5C22]")}>{SHIP_LABEL[r.ship_status] ?? r.ship_status}</span> : "—"}
                  {r.ship_error && <span className="text-xs text-[#9A4520] mr-2"><bdi dir="ltr">{r.ship_error}</bdi></span>}
                </td>
                <td className="px-4 py-3 text-[#55677C] whitespace-nowrap">{fmt(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SubmissionDrawer({ row, onClose, onChanged }: { row: SubmissionRow; onClose: () => void; onChanged: () => void }) {
  const [full, setFull] = useState<SubmissionFull | null>(null);
  const [def, setDef] = useState<Questionnaire | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    let live = true;
    setFull(null); setDef(null); setErr("");
    (async () => {
      try {
        const f = await staffRpc<SubmissionFull>("form_submission_get", { p_id: row.id });
        if (!live) return;
        setFull(f);
        if (isQuestionnaireKey(row.questionnaire_key)) setDef(await loadQuestionnaire(row.questionnaire_key));
      } catch (e) { if (live) setErr(explain(e)); }
    })();
    return () => { live = false; };
  }, [row.id, row.questionnaire_key]);

  const setStatus = async (status: "submitted" | "reviewed") => {
    setBusy(true);
    try {
      await staffRpc("form_submission_set_status", { p_id: row.id, p_status: status, p_note: note || null });
      onChanged(); onClose();
    } catch (e) { setErr(explain(e)); } finally { setBusy(false); }
  };

  const download = async (docId: string) => {
    try {
      const { data: { session } } = await untypedSupabase.auth.getSession();
      if (!session) { setErr("צריך להתחבר מחדש."); return; }
      const res = await fetch(`${SITE_SUPABASE_URL}/functions/v1/client-docs?document_id=${encodeURIComponent(docId)}`, { headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store" });
      if (!res.ok) { setErr(res.status === 403 ? "נדרש אימות דו־שלבי טרי כדי להוריד מסמך." : "ההורדה לא הצליחה."); return; }
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a"); a.href = url; a.download = `client-doc-${docId.slice(0, 8)}`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch { setErr("ההורדה לא הצליחה."); }
  };

  const derived = full?.derived ?? row.derived;
  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-labelledby="sub-drawer-h">
      <button type="button" className="flex-1 bg-black/30" aria-label="סגירה" onClick={onClose} />
      <aside className="w-full max-w-2xl bg-[#FAF7EF] h-full overflow-y-auto shadow-xl p-5 sm:p-7" dir="rtl">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 id="sub-drawer-h" className="text-xl font-bold text-[#203957]">{QUESTIONNAIRE_TITLE[row.questionnaire_key] ?? row.questionnaire_key}</h3>
            <p className="text-sm text-[#55677C]">
              {[row.first_name, row.last_name].filter(Boolean).join(" ")} · <bdi dir="ltr">{full?.identity.id_masked ?? row.id_masked}</bdi>
              {full?.identity.phone && <> · <bdi dir="ltr">{full.identity.phone}</bdi></>}{full?.identity.email && <> · {full.identity.email}</>}
            </p>
            <p className="text-xs text-[#55677C] mt-1">{STATUS_LABEL[row.status]} · נשלח {fmt(row.submitted_at)} · השלמה <bdi dir="ltr">{row.completion_pct}%</bdi>{full?.signer?.name ? ` · חתם/ה: ${full.signer.name}` : ""}</p>
          </div>
          <button type="button" onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-[#EEF2EC] text-[#55677C]" aria-label="סגירה">✕</button>
        </div>
        {err && <div className="bg-[#FBEFEA] text-[#9A4520] rounded-xl p-3 mb-4 text-sm" role="alert">{err}</div>}
        {!full && !err && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#203957]" /></div>}

        {full && Object.keys(derived).length > 0 && (
          <section className="bg-white rounded-xl border p-4 mb-4">
            <h4 className="font-bold text-[#203957] mb-2">תוצאות</h4>
            <dl className="text-sm grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              {Object.entries(derived).map(([k, v]) => (
                <div key={k} className="contents"><dt className="text-[#55677C]">{k === "risk_label" ? "רמת סיכון" : k === "health_screening" ? "סינון בריאותי" : k}</dt><dd>{typeof v === "object" && v ? JSON.stringify(v) : String(v)}</dd></div>
              ))}
            </dl>
          </section>
        )}

        {full && (row.questionnaire_key === "health" && !full.answers_stored) && (
          <p className="text-sm text-[#55677C] bg-white rounded-xl border p-4 mb-4">התשובות של שאלון הבריאות לא נשמרו בשרת (המתג סגור). נשמרה רק תוצאת הסינון.</p>
        )}
        {full && def && Object.keys(full.answers).length > 0 && (
          <div className="sd-q" style={{ minHeight: 0, background: "transparent" }}>
            <Suspense fallback={null}><ResponseViewer def={def} answers={full.answers} /></Suspense>
          </div>
        )}
        {full && !def && row.questionnaire_key === RISK_QUESTIONNAIRE_KEY && (
          <section className="bg-white rounded-xl border p-4 mb-4 text-sm">
            <h4 className="font-bold text-[#203957] mb-2">תשובות</h4>
            <pre className="whitespace-pre-wrap text-xs" dir="ltr">{JSON.stringify(full.answers, null, 2)}</pre>
          </section>
        )}

        {full && full.documents.length > 0 && (
          <section className="bg-white rounded-xl border p-4 mb-4">
            <h4 className="font-bold text-[#203957] mb-2">מסמכים</h4>
            <ul className="text-sm space-y-2">
              {full.documents.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3">
                  <span>{DOCUMENT_LABELS[d.kind as DocumentKind] ?? d.kind} · {fmt(d.created_at)}{!d.stored ? " · לא נשמר" : ""}</span>
                  {d.stored && <button type="button" className="text-[#203957] underline" onClick={() => void download(d.id)}>הורדה</button>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {full && row.status !== "draft" && (
          <section className="bg-white rounded-xl border p-4">
            <h4 className="font-bold text-[#203957] mb-2">טיפול</h4>
            {full.review_note && <p className="text-sm text-[#55677C] mb-2">הערה קודמת: {full.review_note}</p>}
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="הערה (לא חובה)" className="mb-3 rounded-xl border-[#D9DEE4]" />
            <div className="flex flex-wrap gap-2">
              {row.status === "submitted"
                ? <button type="button" disabled={busy} onClick={() => void setStatus("reviewed")} className="h-10 px-4 rounded-full bg-[#203957] text-white text-sm font-medium disabled:opacity-60">סומן כטופל</button>
                : <button type="button" disabled={busy} onClick={() => void setStatus("submitted")} className="h-10 px-4 rounded-full border border-[#D9DEE4] text-sm bg-white">להחזיר לממתינים</button>}
            </div>
          </section>
        )}
      </aside>
    </div>
  );
}
