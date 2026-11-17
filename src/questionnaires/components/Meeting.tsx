// "מצב מפגש": 3-5 field lead capture with big touch targets, instant success state, a hand-the-client-a-link block, and an in-memory list.
// Payload matches supabase save_lead (origin 'meeting'). Nothing is sent; the list lives in memory + sessionStorage.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { buildLeadPayload, MEETING_TOPICS, newSessionId } from "../adapters";
import type { SaveLeadPayload } from "../adapters";
import { requestsAdapter } from "../mocks";
import { copyText } from "../format";
import { formatPhone, validateIsraeliPhone, validatePersonName } from "../validators";
import index from "@/data/questionnaires.index.json";
import "../questionnaires.css";

interface Lead { id: string; at: string; name: string; phone: string; topics: string[]; note: string; payload: SaveLeadPayload }
const LS = "seeld-q-leads";
function loadLeads(): Lead[] { try { return JSON.parse(sessionStorage.getItem(LS) ?? "[]"); } catch { return []; } }
function saveLeads(l: Lead[]) { try { sessionStorage.setItem(LS, JSON.stringify(l)); } catch { /* memory only */ } }

export default function Meeting() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  const [tried, setTried] = useState(false);
  const [leads, setLeads] = useState<Lead[]>(loadLeads);
  const [done, setDone] = useState<Lead | null>(null);
  const [handoff, setHandoff] = useState<{ url: string; code: string } | null>(null);
  const [qkey, setQkey] = useState("personal");
  const [copied, setCopied] = useState(false);
  const session = useState(() => newSessionId())[0];
  useEffect(() => saveLeads(leads), [leads]);

  const nameR = validatePersonName(name, { min: 2, max: 60 });
  const phoneR = validateIsraeliPhone(phone);
  const topicOk = topics.length > 0;
  const ok = nameR.ok && phoneR.ok && topicOk && consent;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!ok) return;
    const payload = buildLeadPayload({ firstName: nameR.value!, phone: phoneR.value!, topics, note, consent }, session + leads.length);
    const lead: Lead = { id: newSessionId(), at: new Date().toISOString(), name: nameR.value!, phone: phoneR.value!, topics, note, payload };
    setLeads([lead, ...leads]);
    setDone(lead);
  };
  const reset = () => { setName(""); setPhone(""); setTopics([]); setNote(""); setConsent(false); setTried(false); setDone(null); setHandoff(null); };
  const makeLink = async () => {
    const r = await requestsAdapter.create({ questionnaireKey: qkey, customerRef: `meeting-${done?.id.slice(0, 6) ?? "x"}`, expiresInDays: 7 });
    setHandoff({ url: r.url, code: r.code });
  };
  const topicLabel = (id: string) => MEETING_TOPICS.find((t) => t.id === id)?.label ?? id;

  return (
    <div className="sd-q sd-q-meeting" dir="rtl">
      <header className="sd-q-top">
        <div className="sd-q-top-row"><Link to={"/app/questionnaires"} className="sd-q-exit">לכל השאלונים</Link><span className="sd-q-modechip">תיעוד מהיר</span></div>
        <h1 className="sd-q-title">מצב מפגש</h1>
        <p className="sd-q-p">רושמים פנייה בכמה שניות, וממשיכים לשוחח.</p>
      </header>
      <main className="sd-q-main">
        {!done ? (
          <form className="sd-q-card" onSubmit={submit} noValidate aria-label="פנייה חדשה">
            <div className="sd-q-subfield">
              <label htmlFor="m-name" className="sd-q-sublabel">שם פרטי</label>
              <input id="m-name" className="sd-q-input sd-q-big" value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" aria-invalid={tried && !nameR.ok || undefined} />
              {tried && !nameR.ok && <p className="sd-q-error" role="alert">{nameR.message}</p>}
            </div>
            <div className="sd-q-subfield">
              <label htmlFor="m-phone" className="sd-q-sublabel">טלפון נייד</label>
              <input id="m-phone" className="sd-q-input sd-q-big" inputMode="tel" dir="ltr" style={{ textAlign: "right" }} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="052-1234567" autoComplete="tel" aria-invalid={tried && !phoneR.ok || undefined} />
              {tried && !phoneR.ok && <p className="sd-q-error" role="alert">{phoneR.message}</p>}
            </div>
            <fieldset className="sd-q-subfield">
              <legend className="sd-q-sublabel">על מה מדברים</legend>
              <div className="sd-q-choices is-many">
                {MEETING_TOPICS.map((t) => (
                  <label key={t.id} className={`sd-q-choice is-check ${topics.includes(t.id) ? "is-on" : ""}`}>
                    <input type="checkbox" checked={topics.includes(t.id)} onChange={() => setTopics(topics.includes(t.id) ? topics.filter((x) => x !== t.id) : [...topics, t.id])} />
                    <span>{t.label}</span>
                  </label>
                ))}
              </div>
              {tried && !topicOk && <p className="sd-q-error" role="alert">כדאי לבחור נושא אחד לפחות</p>}
            </fieldset>
            <div className="sd-q-subfield">
              <label htmlFor="m-note" className="sd-q-sublabel">שורה חופשית (לא חובה)</label>
              <input id="m-note" className="sd-q-input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
            </div>
            <label className={`sd-q-choice is-check ${consent ? "is-on" : ""}`}>
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>הלקוח הסכים שניצור איתו קשר</span>
            </label>
            {tried && !consent && <p className="sd-q-error" role="alert">צריך לסמן את ההסכמה לפני השמירה</p>}
            <p className="sd-q-note" role="note">בשלב זה הפנייה נשמרת רק בדפדפן הזה ואינה נשלחת.</p>
            <button type="submit" className="sd-q-btn sd-q-bigbtn">שמירת הפנייה</button>
          </form>
        ) : (
          <section className="sd-q-card sd-q-done" role="status" aria-live="polite">
            <h2 className="sd-q-qtitle">נשמר</h2>
            <p className="sd-q-p">{done.name}, {formatPhone(done.phone)}. {done.topics.map(topicLabel).join(", ")}</p>
            <div className="sd-q-handoff">
              <h3>רוצים שהלקוח ימלא שאלון בטלפון שלו?</h3>
              <label htmlFor="m-q" className="sd-q-sublabel">איזה שאלון</label>
              <select id="m-q" className="sd-q-input" value={qkey} onChange={(e) => { setQkey(e.target.value); setHandoff(null); }}>
                {(index as { key: string; title: string }[]).map((i) => <option key={i.key} value={i.key}>{i.title}</option>)}
              </select>
              {!handoff ? <button type="button" className="sd-q-btn is-quiet" onClick={makeLink}>יצירת קישור וקוד</button> : (
                <div className="sd-q-linkbox">
                  <div><small>קישור</small><code dir="ltr">{handoff.url}</code><button type="button" className="sd-q-linkbtn" onClick={async () => setCopied(await copyText(handoff.url))}>{copied ? "הועתק" : "העתקה"}</button></div>
                  <div><small>קוד</small><code dir="ltr" className="sd-q-code">{handoff.code}</code></div>
                  <small className="sd-q-fine">מצב הדגמה: הקישור לא פעיל בשרת. QR ייתווסף אחרי אישור ספרייה.</small>
                </div>
              )}
            </div>
            <div className="sd-q-confirm-actions"><button type="button" className="sd-q-btn" onClick={reset}>פנייה חדשה</button></div>
          </section>
        )}
        <section className="sd-q-card sd-q-leads" aria-labelledby="m-leads-h">
          <h2 id="m-leads-h" className="sd-q-h3">לידים מהמפגש ({leads.length})</h2>
          {leads.length === 0 ? <p className="sd-q-fine">עדיין אין פניות במפגש הזה.</p> : (
            <ul>
              {leads.map((l) => (
                <li key={l.id}><b>{l.name}</b> <span dir="ltr">{formatPhone(l.phone)}</span><small>{new Date(l.at).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })} · {l.topics.map(topicLabel).join(", ")}</small></li>
              ))}
            </ul>
          )}
          {leads.length > 0 && <button type="button" className="sd-q-linkbtn" onClick={() => { setLeads([]); }}>ניקוי הרשימה</button>}
        </section>
      </main>
    </div>
  );
}
