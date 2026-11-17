import { KIND_LABEL, INSURANCE_LABEL } from "../builders";
import { NO_INFO, formatCurrency, formatDate, formatMonth, formatPercent, maskPolicy } from "../format";
import type { DepositRow, Loan, Product } from "../types";
import { Block, LockedBlock, LockedLine } from "./LockedBlock";
import { useBlock, useReport } from "./context";

export const STATUS_LABEL = { active: "פעיל", inactive: "לא פעיל", unknown: NO_INFO } as const;

export function StatusPill({ status }: { status: Product["status"] }) {
  return <span className="rp-pill" data-tone={status}>{STATUS_LABEL[status]}</span>;
}

function Table({ caption, head, children, className = "" }: { caption: string; head: string[]; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rp-tablewrap ${className}`} tabIndex={0} role="region" aria-label={caption}>
      <table className={`rp-table ${head.length >= 5 ? "is-wide" : ""}`}>
        <caption className="sr-only">{caption}</caption>
        <thead><tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function CapitalByType() {
  const { report } = useReport();
  const c = report.capitalByType;
  return (
    <Block id="capital-by-type">
      <section className="rp-block">
        <h3 className="rp-h3">סך ההון מהחיסכון, לפי סוג</h3>
        <Table caption="סך ההון מהחיסכון לפי סוג" head={["סוג", "יתרה"]}>
          <tr><th scope="row">תגמולי עובד</th><td>{formatCurrency(c.employee)}</td></tr>
          <tr><th scope="row">תגמולי מעסיק</th><td>{formatCurrency(c.employer)}</td></tr>
          <tr><th scope="row">פיצויים</th><td>{formatCurrency(c.severance)}</td></tr>
          <tr><th scope="row">לא מפוצל בקובץ (גמל, השתלמות ואחרים)</th><td>{formatCurrency(c.other)}</td></tr>
          <tr className="rp-total"><th scope="row">סך הכל</th><td>{formatCurrency(c.total)}</td></tr>
        </Table>
      </section>
    </Block>
  );
}

export function DepositsMonthly() {
  const { report } = useReport();
  const d = report.depositsMonthlyByType;
  return (
    <Block id="deposits-monthly">
      <section className="rp-block">
        <h3 className="rp-h3">הפקדות חודשיות, לפי סוג</h3>
        <p className="rp-quiet">לפי ההפקדה האחרונה שדווחה בכל מוצר.</p>
        <Table caption="הפקדות חודשיות לפי סוג" head={["סוג", "הפקדה חודשית"]}>
          <tr><th scope="row">עובד</th><td>{formatCurrency(d.employee)}</td></tr>
          <tr><th scope="row">מעסיק</th><td>{formatCurrency(d.employer)}</td></tr>
          <tr><th scope="row">פיצויים</th><td>{formatCurrency(d.severance)}</td></tr>
          <tr className="rp-total"><th scope="row">סך הכל</th><td>{formatCurrency(d.total)}</td></tr>
        </Table>
      </section>
    </Block>
  );
}

export function Projection() {
  const { report } = useReport();
  const p = report.projection;
  return (
    <div className="rp-two">
      <Block id="projected-no-deposits">
        <section className="rp-block">
          <h3 className="rp-h3">צפי בפרישה, ללא הפקדות עתידיות</h3>
          <Table caption="צפי בפרישה ללא הפקדות עתידיות" head={["נתון", "ערך"]}>
            <tr><th scope="row">הון צפוי</th><td>{formatCurrency(p.noDeposits.capital)}</td></tr>
            <tr><th scope="row">קצבה חודשית צפויה</th><td>{formatCurrency(p.noDeposits.pension)}</td></tr>
          </Table>
          <p className="rp-foot">הנתון מחושב על ידי הגוף המנהל, לפי הנחות שהוא קבע.</p>
        </section>
      </Block>
      <Block id="projected-with-deposits">
        <section className="rp-block">
          <h3 className="rp-h3">צפי בפרישה, כולל הפקדות עתידיות</h3>
          <Table caption="צפי בפרישה כולל הפקדות עתידיות" head={["נתון", "ערך"]}>
            <tr><th scope="row">הון צפוי</th><td>{formatCurrency(p.withDeposits.capital)}</td></tr>
            <tr><th scope="row">קצבה חודשית צפויה</th><td>{formatCurrency(p.withDeposits.pension)}</td></tr>
          </Table>
          <p className="rp-foot">הנתון מחושב על ידי הגוף המנהל, לפי הנחות שהוא קבע.</p>
        </section>
      </Block>
    </div>
  );
}

export function LoanTable() {
  const { report } = useReport();
  const loans: Loan[] = report.data.loans;
  return (
    <Block id="loans">
      <section className="rp-block">
        <h3 className="rp-h3">הלוואות</h3>
        {loans.length === 0 ? (
          <p className="rp-quiet">בקבצים לא דווחו הלוואות על מוצרי החיסכון.</p>
        ) : (
          <Table caption="הלוואות מתוך מוצרי החיסכון" head={["תאריך קבלה", "סכום", "מוצר", "ריבית", "החזר חודשי", "יתרת סגירה", "תאריך סיום"]}>
            {loans.map((l, i) => (
              <tr key={i}>
                <td>{formatDate(l.startDate)}</td><td>{formatCurrency(l.amount)}</td><td>{l.productLabel}</td><td>{formatPercent(l.interestPct, 2)}</td>
                <td>{formatCurrency(l.monthlyPayment)}</td><td>{formatCurrency(l.balance)}</td><td>{formatDate(l.endDate)}</td>
              </tr>
            ))}
          </Table>
        )}
      </section>
    </Block>
  );
}

export function ProductsTable() {
  const { report } = useReport();
  const sav = report.data.products.filter((p) => p.kind !== "insurance");
  const names = new Map(report.data.persons.map((p) => [p.key, p.displayName]));
  const multi = report.data.persons.length > 1;
  return (
    <Block id="products-table">
      <section className="rp-block">
        <h3 className="rp-h3">מוצרי החיסכון</h3>
        <Table caption="מוצרי החיסכון: יתרה, דמי ניהול וצפי" head={["מוצר", "יתרה", "דמי ניהול מהפקדה", "דמי ניהול מהצבירה", "סטטוס", "קצבה צפויה"]}>
          {sav.map((p) => (
            <tr key={p.id}>
              <th scope="row">
                <b>{KIND_LABEL[p.kind]}</b> <span className="rp-quiet">{p.planName}</span>{p.typeBasis === "code" && <span className="rp-badge" title="סוג המוצר נקבע לפי קוד בקובץ, והמשמעות מוסקת">סיווג מוסק</span>}
                <small>{p.manufacturer}{multi ? ` · ${names.get(p.ownerKey) ?? ""}` : ""}{p.policyNumber ? ` · ${maskPolicy(p.policyNumber)}` : ""}</small>
                {p.fromOlderExtraction && <small className="rp-warn">מהפקה קודמת של המסלקה</small>}
              </th>
              <td>{formatCurrency(p.balance)}</td>
              <td>{formatPercent(p.feeFromDepositPct, 2)}</td>
              <td>{formatPercent(p.feeFromBalancePct, 2)}</td>
              <td><StatusPill status={p.status} /></td>
              <td>{formatCurrency(p.projectedPensionMonthlyNoDeposits)}</td>
            </tr>
          ))}
        </Table>
        <dl className="rp-gloss">
          <div><dt>דמי ניהול מהפקדה</dt><dd>אחוז שהגוף המנהל גובה מכל סכום שמופקד.</dd></div>
          <div><dt>דמי ניהול מהצבירה</dt><dd>אחוז שנתי שנגבה מהיתרה שנצברה בחשבון.</dd></div>
        </dl>
      </section>
    </Block>
  );
}

export function EmploymentTable() {
  const { report } = useReport();
  const sav = report.data.products.filter((p) => p.kind !== "insurance" && (p.employer || p.salary !== null || p.lastDepositDate));
  return (
    <Block id="employment-salary">
      <section className="rp-block">
        <h3 className="rp-h3">מעסיק, שכר והפקדה אחרונה</h3>
        <Table caption="מעסיק, שכר והפקדה אחרונה" head={["מוצר", "מעסיק", "שכר מדווח", "תאריך שכר", "הפקדה אחרונה"]}>
          {sav.map((p) => (
            <tr key={p.id}><th scope="row">{KIND_LABEL[p.kind]} <span className="rp-quiet">{p.manufacturer}</span></th><td>{p.employer ?? NO_INFO}</td><td>{formatCurrency(p.salary)}</td><td>{formatDate(p.salaryDate)}</td><td>{formatDate(p.lastDepositDate)}</td></tr>
          ))}
        </Table>
      </section>
    </Block>
  );
}

/** End date cell: a date, or the words the source uses for open-ended policies. */
export function endLabel(p: Product): string {
  if (p.term === "renewing") return "מתחדש";
  if (p.term === "lifelong") return "לכל החיים";
  return formatDate(p.endDate);
}

export function DepositsTable({ product, full = true }: { product: Product; full?: boolean }) {
  const st = useBlock("product-deposits");
  if (!st) return null;
  if (st.status === "locked") return full ? <LockedBlock id="product-deposits" compact title="12 ההפקדות האחרונות בכל מוצר" /> : <LockedLine id="product-deposits" />;
  const rows: DepositRow[] = product.deposits.slice(0, 12);
  const hasOther = rows.some((r) => r.other !== null);
  return (
    <section className="rp-sub" data-block="product-deposits">
      <h4 className="rp-h4">12 ההפקדות האחרונות</h4>
      {rows.length === 0 ? <p className="rp-quiet">{NO_INFO}</p> : (
        <Table caption={`הפקדות אחרונות: ${product.planName}`} head={hasOther ? ["חודש", "עובד", "מעסיק", "פיצויים", "משלם אחר", "שכר"] : ["חודש", "עובד", "מעסיק", "פיצויים", "שכר"]}>
          {rows.map((r) => (
            <tr key={r.month}><th scope="row">{formatMonth(r.month)}</th><td>{formatCurrency(r.employee, "–")}</td><td>{formatCurrency(r.employer, "–")}</td><td>{formatCurrency(r.severance, "–")}</td>{hasOther && <td>{formatCurrency(r.other, "–")}</td>}<td>{formatCurrency(r.salary, "–")}</td></tr>
          ))}
        </Table>
      )}
    </section>
  );
}

export { INSURANCE_LABEL, Table };
