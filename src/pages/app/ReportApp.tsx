import { Link } from "react-router-dom";
import { tintStyle, useSdFont } from "@/components/sd/primitives";
import { CaEmpty, CaPanel } from "@/components/sd/client";
import { ReportDropZone, ReportNextCards, ReportNote, ReportStepper, REPORT_DISCLAIMER } from "@/components/sd/ReportParts";
import "@/components/sd/home-entry.css";

/**
 * /app/report: shell of the report flow inside the signed-in area. Layout and states only.
 * No upload, no storage, no processing: those open after the design phase (docs/product/CLIENT-PORTAL-PLAN.md).
 */
export default function ReportApp() {
  useSdFont();
  return (
    <div className="sd" dir="rtl" style={tintStyle("lavender")}>
      <div className="sd-wrap" style={{ paddingBlock: 8 }}>
        <header style={{ marginBottom: 20 }}>
          <span className="sd-eyebrow">הפקת דוח אישי</span>
          <h1 className="sd-h2" style={{ marginTop: 8 }}>דוח אישי מהמסלקה ומהר הביטוח</h1>
          <p className="sd-text" style={{ marginTop: 8 }}>
            חמישה שלבים. הדוח הוא שני השלבים הראשונים, וההמשך הוא בחירה שלכם. {REPORT_DISCLAIMER}
          </p>
        </header>

        <div className="space-y-5">
          <ReportNote>התהליך בהכנה וטרם נפתח. המסך מציג את הדרך כפי שתיראה.</ReportNote>
          <ReportStepper active={0} headingLevel="h2" />

          <CaPanel tone="sky">
            <h2 className="sd-h3">שלב 1: העלאת קבצים</h2>
            <p className="sd-text" style={{ margin: "6px 0 14px" }}>קובץ מסלקה וקובץ הר הביטוח.</p>
            <ReportDropZone />
          </CaPanel>

          <CaPanel tone="butter">
            <h2 className="sd-h3">שלב 2: סקירת הדוח</h2>
            <CaEmpty compact tone="butter" art="10-financial-planning" title="עדיין אין דוח" text="אחרי העלאת הקבצים יופיע כאן הדוח, ואפשר יהיה לעבור עליו ולשמור אותו." />
          </CaPanel>

          <h2 className="sd-h3">שלבים 3 עד 5: המשך לפי בחירתכם</h2>
          <ReportNextCards />

          <p className="sd-text">
            שאלה לגבי התהליך? <Link to="/contact" className="sd-link">יצירת קשר עם הצוות</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
