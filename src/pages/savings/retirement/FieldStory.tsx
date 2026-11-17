import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnswerSummary from "@/components/AnswerSummary";
import { SdBand, tintStyle, useSdFont } from "@/components/sd/primitives";
import { PubHead, PubHero } from "@/components/sd/pub";
import { Arrow, RpClose, RpPageNav, RpRegLine } from "@/components/retire/parts";
import { CASE, FINDINGS, RP, RP_CASE_LABEL, RP_HOW } from "@/data/retirementPlanning";
import "@/components/sd/sd.css";
import "@/components/sd/pub.css";

// The field story: one de-identified case, only the owner's facts and rounded figures, labelled as a single case.

export default function FieldStory() {
  useSdFont();

  return (
    <div className="sd min-h-screen" dir="rtl" style={tintStyle("sage")}>
      <Header />
      <main>
        <PubHero
          crumbs={[{ label: "דף הבית", to: "/" }, { label: "תכנון פרישה", to: RP }, { label: "סיפור מהשטח" }]}
          eyebrow={RP_CASE_LABEL}
          title={CASE.title}
          lead={CASE.intro}
          art="27-post-retirement-bench"
          tint="sage"
        >
          <div className="sd-brief sd-rp-summary">
            <b>בקצרה</b>
            <AnswerSummary className="" />
          </div>
        </PubHero>

        <RpPageNav />

        <SdBand tone="cream" id="found" art="30-rights-found-key">
          <div className="sd-wrap">
            <PubHead title="מה מצאנו" lede="כל שורה היא ממצא בתיק, ומה הוא אומר." />
            <div className="sd-rp-casebox">
              <div className="sd-rp-case-head" aria-hidden="true"><span>מה מצאנו</span><span>מה זה אומר</span></div>
              {CASE.rows.map((r) => (
                <div key={r.found} className="sd-rp-case-row">
                  <b>{r.found}</b>
                  <span>{r.means}</span>
                </div>
              ))}
            </div>
            <p className="sd-rp-lede mt-6" style={{ fontSize: 15.5 }}>{CASE.disclaimer}</p>
          </div>
        </SdBand>

        <SdBand tone="butter" id="did" art="32-process-steps">
          <div className="sd-wrap"><div className="sd-pub-copy">
            <PubHead title={CASE.didTitle} />
            <p className="sd-text" style={{ fontSize: 18, lineHeight: 1.9 }}>{CASE.did}</p>
            <p className="mt-8"><Link to={RP_HOW} className="sd-link">איך נראה כל שלב בתהליך<Arrow /></Link></p>
          </div></div>
        </SdBand>

        <SdBand tone="lavender" id="note" art="24-pension-family-umbrella">
          <div className="sd-wrap"><div className="sd-pub-copy">
            <PubHead title={CASE.noteTitle} />
            <p className="sd-rp-quote" style={{ marginTop: 0 }}>{CASE.note}</p>
            <p className="sd-rp-lede mt-8">שבעה דברים שחוזרים בתיקי פרישה, ושאנחנו בודקים בכל תיק:</p>
            <ul className="sd-rp-lede mt-3" style={{ paddingInlineStart: 20, listStyle: "disc" }}>
              {FINDINGS.map((f) => <li key={f.n} style={{ marginTop: 4 }}>{f.title}</li>)}
            </ul>
          </div></div>
        </SdBand>

        <RpClose
          title="רוצים לראות את התיק שלכם כך"
          text="שיחת היכרות ראשונה, בלי התחייבות. בפגישה מציגים בכתב את מודל התגמול לפני שמתחילים."
          art="33-welcome-table"
        />
        <RpRegLine />
      </main>
      <Footer />
    </div>
  );
}
