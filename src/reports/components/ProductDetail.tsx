// One detail card per savings product: header facts, tracks, returns, breakdown, last deposits (locked unless viewDeposits).
import { KIND_LABEL } from "../builders";
import { NO_INFO, formatCurrency, formatDate, formatPercent, maskPolicy } from "../format";
import type { Product } from "../types";
import { Block, LockedBlock, LockedLine } from "./LockedBlock";
import { useBlock, useReport } from "./context";
import { DepositsTable, StatusPill, Table } from "./tables";

function Fact({ k, v }: { k: string; v: string }) {
  return <div className="rp-fact"><dt>{k}</dt><dd>{v}</dd></div>;
}

export function ProductDetail({ product: p, showLocked = true }: { product: Product; showLocked?: boolean }) {
  const { report } = useReport();
  const deposits = useBlock("product-deposits");
  const unlocked = deposits?.status === "shown";
  const owner = report.data.persons.find((x) => x.key === p.ownerKey);
  return (
    <article className="rp-product" aria-label={`${KIND_LABEL[p.kind]}, ${p.manufacturer}`}>
      <div className="rp-product-head">
        <div>
          <span className="rp-eyebrow">{KIND_LABEL[p.kind]}</span>{p.typeBasis === "code" && <span className="rp-badge" title="סוג המוצר נקבע לפי קוד בקובץ, והמשמעות מוסקת ואינה מפרט רשמי">סיווג מוסק</span>}
          <h3 className="rp-h3">{p.planName}</h3>
          <p className="rp-quiet">{p.manufacturer}{report.data.persons.length > 1 && owner ? ` · ${owner.displayName}` : ""}</p>
        </div>
        <div className="rp-product-bal"><span>יתרה</span><b>{formatCurrency(p.balance)}</b><StatusPill status={p.status} /></div>
      </div>
      <dl className="rp-facts">
        <Fact k="מספר פוליסה או חשבון" v={maskPolicy(p.policyNumber)} />
        <Fact k="תאריך הצטרפות" v={formatDate(p.joinDate)} />
        <Fact k="נכון לתאריך" v={formatDate(p.asOfDate)} />
        <Fact k="קצבה חודשית צפויה" v={formatCurrency(p.projectedPensionMonthlyNoDeposits)} />
        <Fact k="דמי ניהול מהפקדה" v={formatPercent(p.feeFromDepositPct, 2)} />
        <Fact k="דמי ניהול מהצבירה" v={formatPercent(p.feeFromBalancePct, 2)} />
        <Fact k="מעסיק" v={unlocked ? p.employer ?? NO_INFO : "נעול, ראו בהמשך"} />
        <Fact k="שכר מדווח" v={unlocked ? formatCurrency(p.salary) : "נעול, ראו בהמשך"} />
        <Fact k="הפקדה אחרונה" v={unlocked ? formatDate(p.lastDepositDate) : "נעול, ראו בהמשך"} />
      </dl>
      {p.fromOlderExtraction && <p className="rp-warn">הנתונים במוצר זה לקוחים מהפקה קודמת של המסלקה ולא התעדכנו בהפקה האחרונה.</p>}

      <Block id="product-tracks">
        <section className="rp-sub">
          <h4 className="rp-h4">מסלולי השקעה</h4>
          {p.tracks.length === 0 ? <p className="rp-quiet">{NO_INFO}</p> : (
            <Table caption={`מסלולי השקעה: ${p.planName}`} head={["מסלול", "יתרה", "אחוז הפקדה", "עלות שנתית", "תשואה מדווחת"]}>
              {p.tracks.map((t) => (
                <tr key={t.name}><th scope="row">{t.name}</th><td>{formatCurrency(t.balance)}</td><td>{formatPercent(t.depositSharePct)}</td><td>{formatPercent(t.annualCostPct, 2)}</td><td>{formatPercent(t.returnPct)}</td></tr>
              ))}
            </Table>
          )}
        </section>
      </Block>
      <LockedBlockIfLocked id="product-returns" full={showLocked} />
      <Block id="product-breakdown">
        <section className="rp-sub">
          <h4 className="rp-h4">פירוט היתרה</h4>
          <Table caption={`פירוט היתרה: ${p.planName}`} head={["רכיב", "יתרה"]}>
            <tr><th scope="row">תגמולי עובד</th><td>{formatCurrency(p.balanceSplit.employee)}</td></tr>
            <tr><th scope="row">תגמולי מעסיק</th><td>{formatCurrency(p.balanceSplit.employer)}</td></tr>
            <tr><th scope="row">פיצויים</th><td>{formatCurrency(p.balanceSplit.severance)}</td></tr>
          </Table>
        </section>
      </Block>
      <DepositsTable product={p} full={showLocked} />
    </article>
  );
}

function LockedBlockIfLocked({ id, full }: { id: string; full: boolean }) {
  const st = useBlock(id);
  if (!st || st.status !== "locked") return null;
  return full ? <LockedBlock id={id} compact /> : <LockedLine id={id} />;
}
