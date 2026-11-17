import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnswerSummary from "@/components/AnswerSummary";
import { SdBand, tintStyle, useSdFont } from "@/components/sd/primitives";
import { PubHero } from "@/components/sd/pub";
import { useFaqJsonLd } from "@/hooks/useFaqJsonLd";
import { RpClose, RpFaqList, RpPageNav, RpRegLine } from "@/components/retire/parts";
import { FAQS, RP } from "@/data/retirementPlanning";
import "@/components/sd/sd.css";
import "@/components/sd/pub.css";

// Questions that real clients asked. Every answer is in the DOM (details) and in the FAQPage JSON-LD.

export default function RetirementFaq() {
  useSdFont();
  useFaqJsonLd(FAQS);

  return (
    <div className="sd min-h-screen" dir="rtl" style={tintStyle("butter")}>
      <Header />
      <main>
        <PubHero
          crumbs={[{ label: "דף הבית", to: "/" }, { label: "תכנון פרישה", to: RP }, { label: "שאלות נפוצות" }]}
          eyebrow="שאלות נפוצות"
          title="שאלות שלקוחות שאלו אותנו"
          lead="על קיבוע זכויות, קופות קטנות, פוליסות ישנות, קצבה מול הון, ועל מה שקורה כשילדים מסדרים את ענייני ההורים."
          art="11-claims-service"
          tint="butter"
        >
          <div className="sd-brief sd-rp-summary">
            <b>בקצרה</b>
            <AnswerSummary className="" />
          </div>
        </PubHero>

        <RpPageNav />

        <SdBand tone="cream" id="faq" art="05-retirement">
          <div className="sd-wrap-narrow">
            <RpFaqList items={FAQS} />
          </div>
        </SdBand>

        <RpClose
          title="יש שאלה שלא מופיעה כאן"
          text="נשמח לשמוע אותה בשיחת היכרות ראשונה, בלי התחייבות."
          art="33-welcome-table"
        />
        <RpRegLine />
      </main>
      <Footer />
    </div>
  );
}
