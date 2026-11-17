import { useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { tintStyle, useSdFont } from "@/components/sd/primitives";
import { RpRegLine } from "@/components/retire/parts";
import { CHECKLIST, RP, RP_REG_LINE } from "@/data/retirementPlanning";
import "@/components/sd/sd.css";
import "@/components/retire/retire.css";

// The lead magnet as a printable page (noindex, not in the sitemap). It follows the owner's "רשימת הכנה ללקוח"
// document (2 A4 pages) without the agent's personal name or licence number. The owner's PDF itself is not linked:
// see CHECKLIST_PDF_URL in src/data/retirementPlanning.ts.

export default function RetirementChecklist() {
  useSdFont();
  useEffect(() => {
    const id = window.setTimeout(() => { document.title = `${CHECKLIST.title} | SEELD`; }, 0);
    return () => window.clearTimeout(id);
  }, []);
  const c = CHECKLIST;

  return (
    <div className="sd min-h-screen" dir="rtl" style={tintStyle("butter")}>
      <Header />
      <main className="sd-rp-sheet-wrap">
        <div className="sd-wrap">
          <div className="sd-rp-sheet-actions no-print">
            <button type="button" className="sd-btn" onClick={() => window.print()}>הדפסה / שמירה כ־PDF</button>
            <Link to={RP} className="sd-link">חזרה לתכנון פרישה</Link>
          </div>

          <article className="sd-rp-sheet">
            <section className="sd-rp-page">
              <div className="sd-rp-sheet-head">
                <img src="/brand/logo.png" alt="שילד ביטוח ופיננסים" width={130} height={54} />
                <small>{c.eyebrow}</small>
              </div>
              <h1>{c.h1}</h1>
              <p className="lead">{c.lead}</p>

              <h2>{c.pull.title}</h2>
              <table className="sd-rp-tbl">
                <tbody>
                  {c.pull.rows.map((r) => (
                    <tr key={r.t}><th scope="row">{r.t}</th><td>{r.d}</td></tr>
                  ))}
                </tbody>
              </table>
              <p className="note">{c.pull.note}</p>

              <h2>{c.must.title}</h2>
              <table className="sd-rp-tbl has-box">
                <thead><tr><th className="box" aria-label="סימון" /><th>{c.must.head[0]}</th><th>{c.must.head[1]}</th></tr></thead>
                <tbody>
                  {c.must.rows.map((r) => (
                    <tr key={r.t}><td className="box"><i /></td><th scope="row">{r.t}</th><td>{r.d}</td></tr>
                  ))}
                </tbody>
              </table>

              <h2>{c.maybe.title}</h2>
              <table className="sd-rp-tbl has-box">
                <thead><tr><th className="box" aria-label="סימון" /><th>{c.maybe.head[0]}</th><th>{c.maybe.head[1]}</th></tr></thead>
                <tbody>
                  {c.maybe.rows.map((r) => (
                    <tr key={r.t}><td className="box"><i /></td><th scope="row">{r.t}</th><td>{r.d}</td></tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="sd-rp-page sd-rp-page2">
              <small className="eyebrow">{c.flow.eyebrow}</small>
              <h2 className="big">{c.flow.title}</h2>
              <p className="lead">{c.flow.lead}</p>
              <table className="sd-rp-tbl flow">
                <thead><tr>{c.flow.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {c.flow.rows.map((r) => (
                    <tr key={r.a}><th scope="row">{r.a}</th><td>{r.b}</td><td>{r.c}</td></tr>
                  ))}
                </tbody>
              </table>

              <div className="sd-rp-boxes">
                <div className="b-green"><b>{c.notDo.title}</b><p>{c.notDo.text}</p></div>
                <div className="b-sand"><b>{c.missing.title}</b><p>{c.missing.text}</p></div>
              </div>
              <div className="sd-rp-time"><b>{c.time.title}</b> {c.time.text}</div>

              <p className="reg">{RP_REG_LINE} {c.privacy}</p>
            </section>
          </article>
        </div>
      </main>
      <div className="no-print"><RpRegLine /></div>
      <Footer />
    </div>
  );
}
