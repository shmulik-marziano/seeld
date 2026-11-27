// Requests (the "פניות" tab) and the request sheet ("פנייה לסוכן"). A request is a lead for the right desk (server); the
// client sees two states only: received / done. No promise of a response time.
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CaError, CaLoading } from "@/components/sd/client";
import { ContactIcons } from "@/components/sd/ContactIcons";
import { MY_COPY as C } from "@/lib/client-area/copy";
import { type ClientRequest, errorKindOf, REQUEST_CONTACTS, REQUEST_TOPICS, type RequestContact, type RequestTopic } from "@/lib/client-area/api";
import { useArea } from "../context";
import { dateHe, Sheet } from "../parts";

export function Requests() {
  const { api, requestsEnabled, requestsTick, openRequest, onAuthLost } = useArea();
  const heading = useRef<HTMLHeadingElement>(null);
  const [list, setList] = useState<ClientRequest[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => { heading.current?.focus(); }, []);
  useEffect(() => {
    let live = true;
    setErr(null);
    api.requests().then((r) => { if (live) setList(r.requests); }, (e) => {
      if (!live) return;
      if (errorKindOf(e) === "unauthenticated") onAuthLost(); else setErr(errorKindOf(e) === "unavailable" ? C.errors.unavailable : C.errors.generic);
    });
    return () => { live = false; };
  }, [api, tick, requestsTick, onAuthLost]);

  return (
    <div className="ma-stack">
      <div className="ma-greet ma-greet-row">
        <div>
          <h2 ref={heading} tabIndex={-1} className="ma-h1">{C.requests.title}</h2>
          <p className="ma-muted">{C.requests.lead}</p>
        </div>
        {requestsEnabled && <button type="button" className="ma-btn" onClick={() => openRequest(null)}>{C.requests.newCta}</button>}
      </div>
      {requestsEnabled === false && (
        <div className="ma-card"><p>{C.requests.closed}</p><ContactIcons dept="general" tone="dark" /></div>
      )}
      {err && <CaError title={err} onRetry={() => setTick((t) => t + 1)} actionLabel={C.errors.retry} />}
      {!err && !list && <CaLoading label={C.common.loading} tone="sage" />}
      {list && list.length === 0 && requestsEnabled && <p className="sd-my-empty">{C.requests.empty}</p>}
      {list && list.length > 0 && (
        <ul className="ma-list">
          {list.map((r) => (
            <li key={r.id} className="ma-req">
              <div>
                <b>{C.requests.topics[r.topic]}</b>
                <small>{C.requests.sentOn(dateHe(r.created_at))}</small>
                {r.message && <p>{r.message}</p>}
              </div>
              <b className={r.status === "done" ? "ma-pill is-ok" : "ma-pill is-gold"}>{C.requests.status[r.status]}</b>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function RequestSheet({ topic: initial, onClose, onSent, onShowList }: {
  topic: RequestTopic | null; onClose: () => void; onSent: () => void; onShowList: () => void;
}) {
  const { api, onAuthLost } = useArea();
  const [topic, setTopic] = useState<RequestTopic | null>(initial);
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState<RequestContact>("phone");
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!topic) { setMissing(true); return; }
    setBusy(true);
    setFailed(false);
    try {
      await api.requestCreate({ topic, message: message.trim() || null, contact });
      setSent(true);
      onSent();
    } catch (err) {
      if (errorKindOf(err) === "unauthenticated") { onAuthLost(); return; }
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet label={C.sheet.title} onClose={onClose}>
      <h2 className="ma-h2">{sent ? C.sheet.sentHeading : C.sheet.title}</h2>
      {sent ? (
        <div className="ma-sent" role="status">
          <span className="ma-sent-ic" aria-hidden="true">✓</span>
          <p className="ma-h3">{C.sheet.sentTitle}</p>
          <p className="ma-muted">{C.sheet.sentText(C.sheet.methods[contact])}</p>
          <button type="button" className="ma-btn is-wide" onClick={onShowList}>{C.sheet.toRequests}</button>
        </div>
      ) : (
        <form className="ma-form" onSubmit={submit} noValidate>
          <fieldset>
            <legend>{C.sheet.topicLegend}</legend>
            <div className="ma-opts">
              {REQUEST_TOPICS.map((t) => (
                <button key={t} type="button" aria-pressed={topic === t} onClick={() => { setTopic(t); setMissing(false); }}>{C.requests.topics[t]}</button>
              ))}
            </div>
            {missing && <p className="sd-q-error" role="alert">{C.sheet.topicErr}</p>}
          </fieldset>
          <label htmlFor="ma-req-text">{C.sheet.messageLabel}
            <textarea id="ma-req-text" rows={3} maxLength={1000} value={message} placeholder={C.sheet.messagePlaceholder} onChange={(e) => setMessage(e.target.value)} />
          </label>
          <fieldset>
            <legend>{C.sheet.contactLegend}</legend>
            <div className="ma-opts is-3">
              {REQUEST_CONTACTS.map((c) => (
                <button key={c} type="button" aria-pressed={contact === c} onClick={() => setContact(c)}>{C.sheet.contacts[c]}</button>
              ))}
            </div>
          </fieldset>
          {failed && <p className="sd-q-error" role="alert">{C.sheet.failed}</p>}
          <button type="submit" className="ma-btn is-wide" disabled={busy} aria-busy={busy || undefined}>{busy ? C.sheet.sending : C.sheet.send}</button>
        </form>
      )}
    </Sheet>
  );
}
