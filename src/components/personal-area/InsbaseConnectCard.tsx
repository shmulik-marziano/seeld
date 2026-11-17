import { useState } from "react";
import { Loader2 } from "lucide-react";
import { SdIcon, SdPic } from "@/components/sd/primitives";
import { startConnect } from "@/lib/insbase";
import { BODY, GREEN, MUTED } from "@/lib/brand";

/**
 * "חיבור התיק": the card a signed-in visitor sees before their InsBase file
 * is linked. One button leaves for the InsBase consent screen (ID number +
 * the personal code from the agency); the visitor comes back here linked.
 */
export const InsbaseConnectCard = ({ compact = false }: { compact?: boolean }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const go = async () => {
    setBusy(true);
    setError(null);
    try {
      await startConnect();
    } catch {
      setBusy(false);
      setError("החיבור לא נפתח. נסו שוב בעוד רגע, או פנו אלינו.");
    }
  };

  if (compact) {
    return (
      <section className="sd-ca-soft sd-ca-tone-butter">
        <div className="sd-ca-split has-art">
          <div>
            <h3>התיק עדיין לא מחובר</h3>
            <p className="mt-2 text-[16px] leading-[1.75]">
              חברו את התיק עם תעודת הזהות והקוד האישי שקיבלתם מאיתנו, וכל הפוליסות, הצבירות והכיסויים יופיעו כאן, עם מקור ותאריך לכל נתון.
            </p>
            <button type="button" onClick={go} disabled={busy} className="btn-primary mt-5 w-full sm:w-auto sm:min-w-[200px]">
              {busy ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : "חיבור התיק"}
            </button>
            {error && <p role="alert" className="mt-3 text-[14px]" style={{ color: "#9A4520" }}>{error}</p>}
          </div>
          <div className="sd-ca-split-art" aria-hidden="true"><SdPic name="01-hero" sizes="190px" /></div>
        </div>
      </section>
    );
  }

  return (
    <section className="sd-ca-panel has-stripe sd-ca-tone-butter">
      <div className="sd-ca-split has-art">
        <div>
          <div className="sd-ca-panel-head">
            <SdIcon name="key" size={44} />
            <h3>חיבור התיק</h3>
          </div>
          <p className="mt-4 text-[16px] leading-[1.75]" style={{ color: BODY }}>
            התיק שלכם באינסבייס מרכז את הפוליסות, הצבירות, דמי הניהול והכיסויים מכל החברות, כפי שהם רשומים
            במסלקה הפנסיונית ובהר הביטוח. אחרי החיבור תראו כאן תמונת מצב מלאה, עם מקור ותאריך לכל מספר.
          </p>
          <ol className="mt-4 space-y-2 text-[16px]" style={{ color: BODY }}>
            <li className="flex gap-3"><span className="font-bold tabular-nums" style={{ color: GREEN }}>1.</span> לוחצים על "חיבור התיק" ועוברים למסך ההזדהות של אינסבייס.</li>
            <li className="flex gap-3"><span className="font-bold tabular-nums" style={{ color: GREEN }}>2.</span> מזינים תעודת זהות ואת הקוד האישי שקיבלתם מאיתנו, ומאשרים.</li>
            <li className="flex gap-3"><span className="font-bold tabular-nums" style={{ color: GREEN }}>3.</span> חוזרים לכאן, והתיק מחובר. הניתוק אפשרי בכל רגע מהפרופיל.</li>
          </ol>
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <button type="button" onClick={go} disabled={busy} className="btn-primary w-full sm:w-auto sm:min-w-[220px]">
              {busy ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : "חיבור התיק"}
            </button>
            <p className="text-[14px]" style={{ color: MUTED }}>אין לכם קוד אישי? כתבו לנו תחת פניות ונסדר.</p>
          </div>
          {error && <p role="alert" className="mt-3 text-[14px]" style={{ color: "#9A4520" }}>{error}</p>}
        </div>
        <div className="sd-ca-split-art" aria-hidden="true"><SdPic name="01-hero" sizes="190px" /></div>
      </div>
    </section>
  );
};

export default InsbaseConnectCard;
