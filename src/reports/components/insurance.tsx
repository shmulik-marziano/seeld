// Insurance blocks: premium summary, one card per person with nine coverage tiles, products table, policy details.
import { COVERAGE_ORDER, INSURANCE_LABEL } from "../builders";
import { COVERAGE_TITLES } from "../blocks";
import { NO_INFO, formatCurrency, formatDate, maskPolicy } from "../format";
import type { CoverageKind, PersonCoverageCard } from "../types";
import { Block } from "./LockedBlock";
import { useReport } from "./context";
import { StatusPill, Table, endLabel } from "./tables";
import { Stat } from "./charts";

const TILE_ICON: Record<CoverageKind, string> = {
  disability: "briefcase", survivors: "family", death: "document", nursing: "support", health: "heart",
  mortgageLife: "home", personalAccidents: "umbrella", criticalIllness: "shield", accidentDisability: "claim",
};

export function PremiumSummary() {
  const { report } = useReport();
  const s = report.summary;
  return (
    <Block id="premium-summary">
      <section className="rp-block rp-dash">
        <h2 className="rp-h2">סך הפרמיה החודשית</h2>
        <div className="rp-stats">
          <Stat label="פרמיה חודשית כוללת" value={formatCurrency(s.premiumTotal)} sub={`${s.insuranceCount} פוליסות`} />
          <Stat label="חיים" value={formatCurrency(s.premiumLife)} />
          <Stat label="בריאות" value={formatCurrency(s.premiumHealth)} />
        </div>
        <p className="rp-foot">פרמיות בפוליסות שנתיות מחולקות ב-12. סכום כל הפרמיות מבוסס על מה שדווח בקבצים.</p>
      </section>
    </Block>
  );
}

export function CoverageTiles({ card }: { card: PersonCoverageCard }) {
  return (
    <ul className="rp-tiles" aria-label={`כיסויים ביטוחיים של ${card.person.displayName}`}>
      {COVERAGE_ORDER.map((k) => {
        const t = card.tiles.find((x) => x.kind === k)!;
        const value = t.state === "none-received" ? NO_INFO : t.state === "exists" ? "קיים" : t.monthlyBenefit !== null ? `${formatCurrency(t.monthlyBenefit)} לחודש` : formatCurrency(t.amount);
        return (
          <li key={k} className="rp-tile" data-state={t.state}>
            <img src={`/art/icons/${TILE_ICON[k]}.svg`} alt="" width={40} height={40} loading="lazy" />
            <span className="rp-tile-l">{COVERAGE_TITLES[k]}</span>
            <b className="rp-tile-v">{value}</b>
          </li>
        );
      })}
    </ul>
  );
}

export function PersonCards() {
  const { report } = useReport();
  return (
    <Block id="coverage-cards">
      <div className="rp-people">
        {report.personCards.map((card) => (
          <article key={card.person.key} className="rp-person rp-block" aria-label={`כרטיס ביטוח: ${card.person.displayName}`}>
            <div className="rp-person-head">
              <div>
                <h3 className="rp-h3">{card.person.displayName}</h3>
                <p className="rp-quiet">ת״ז <bdi dir="ltr">{card.person.idMasked}</bdi></p>
              </div>
              <div className="rp-person-prem"><span>סך פרמיה חודשית</span><b>{formatCurrency(card.premiumMonthly)}</b></div>
            </div>
            <CoverageTiles card={card} />
            {card.products.length === 0 ? <p className="rp-quiet">לא התקבל מידע על מוצרי ביטוח לאדם זה.</p> : (
              <Table caption={`מוצרי הביטוח של ${card.person.displayName}`} head={["מוצר", "מבטח", "מספר פוליסה", "פרמיה חודשית", "סטטוס", "תאריך סיום"]}>
                {card.products.map((p) => (
                  <tr key={p.id}>
                    <th scope="row"><b>{INSURANCE_LABEL[p.insuranceType ?? "other"]}</b> <span className="rp-quiet">{p.planName}</span></th>
                    <td>{p.manufacturer}</td><td>{maskPolicy(p.policyNumber)}</td><td>{formatCurrency(p.monthlyPremium)}</td><td><StatusPill status={p.status} /></td><td>{endLabel(p)}</td>
                  </tr>
                ))}
              </Table>
            )}
          </article>
        ))}
      </div>
    </Block>
  );
}

export function CoverageAmounts() {
  const { report } = useReport();
  const rows = report.data.products.flatMap((p) => p.coverages.filter((c) => c.amount !== null || c.monthlyBenefit !== null).map((c) => ({ p, c })));
  const names = new Map(report.data.persons.map((x) => [x.key, x.displayName]));
  return (
    <Block id="coverage-amounts">
      <section className="rp-block">
        <h3 className="rp-h3">סכומי הכיסוי: נכות, שאירים ומוות</h3>
        <Table caption="סכומי כיסוי" head={["כיסוי", "מבוטח", "מוצר", "סכום חד פעמי", "קצבה חודשית"]}>
          {rows.map(({ p, c }, i) => (
            <tr key={i}><th scope="row">{COVERAGE_TITLES[c.kind]}</th><td>{names.get(c.insuredKey) ?? NO_INFO}</td><td>{p.planName}</td><td>{formatCurrency(c.amount, "–")}</td><td>{formatCurrency(c.monthlyBenefit, "–")}</td></tr>
          ))}
        </Table>
      </section>
    </Block>
  );
}

export function PolicyDetails() {
  const { report } = useReport();
  const ins = report.data.products.filter((p) => p.kind === "insurance");
  const names = new Map(report.data.persons.map((x) => [x.key, x.displayName]));
  return (
    <Block id="policy-details">
      <section className="rp-block">
        <h3 className="rp-h3">פירוט הפוליסות</h3>
        <div className="rp-policies">
          {ins.map((p) => (
            <article key={p.id} className="rp-policy">
              <h4 className="rp-h4">{INSURANCE_LABEL[p.insuranceType ?? "other"]} <span className="rp-quiet">{p.manufacturer}</span></h4>
              <dl className="rp-facts">
                <div className="rp-fact"><dt>מספר פוליסה</dt><dd>{maskPolicy(p.policyNumber)}</dd></div>
                <div className="rp-fact"><dt>פרמיה חודשית</dt><dd>{formatCurrency(p.monthlyPremium)}</dd></div>
                <div className="rp-fact"><dt>סטטוס</dt><dd>{p.status === "active" ? "פעיל" : p.status === "inactive" ? "לא פעיל" : NO_INFO}</dd></div>
                <div className="rp-fact"><dt>תאריך הצטרפות</dt><dd>{formatDate(p.joinDate)}</dd></div>
              </dl>
              {p.coverages.length > 0 && (
                <Table caption={`כיסויים בפוליסה`} head={["כיסוי", "מבוטח", "סכום", "פרמיה"]}>
                  {p.coverages.map((c, i) => (
                    <tr key={i}><th scope="row">{COVERAGE_TITLES[c.kind]}</th><td>{names.get(c.insuredKey) ?? NO_INFO}</td><td>{formatCurrency(c.amount ?? c.monthlyBenefit)}</td><td>{formatCurrency(c.premium)}</td></tr>
                  ))}
                </Table>
              )}
            </article>
          ))}
        </div>
      </section>
    </Block>
  );
}
