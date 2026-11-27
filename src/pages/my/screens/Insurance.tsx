// Insurance (the "ביטוחים" tab): the live policies by group with the premium, the covers and, for home / car, the date the
// insurance period ends; then the insurance inside the pension savings (a pension fund's disability and survivors cover as
// the fund reports it, a managers' policy's covers). No recommendation and no promise of handling (owner 2026-11-27): one
// action, a question to the agent.
import { useEffect, useMemo, useRef } from "react";
import { CaError, CaLoading } from "@/components/sd/client";
import type { CoverLine, PortfolioProduct } from "@/lib/client-area/api";
import { MY_COPY as C } from "@/lib/client-area/copy";
import { buildOverview, frequencyOf, INSURANCE_KEYS } from "@/lib/client-area/overview";
import { useArea } from "../context";
import { amountOf, dateHe, plainPct } from "../parts";

const mono = (s: string) => s.trim().charAt(0) || "·";

function Head({ p, hidden }: { p: PortfolioProduct; hidden: boolean }) {
  return (
    <div className="ma-prod-head">
      <span className="ma-mono" aria-hidden="true">{mono(p.company_label)}</span>
      <span className="ma-prod-title"><b>{p.type_label}</b><small>{p.company_label}</small></span>
      {typeof p.premium === "number" && (
        <span className="ma-premium"><b>{amountOf(p.premium, hidden)}</b><small>{C.insurance.per[frequencyOf(p)]}</small></span>
      )}
    </div>
  );
}

function Lines({ label, lines, hidden }: { label: string; lines: CoverLine[]; hidden: boolean }) {
  return <>{lines.map((l) => (
    <li key={`${label}:${l.name}`}>
      <span><b>{l.name}</b>{typeof l.amount === "number" && <small>{C.insurance.coverAmount(amountOf(l.amount, hidden))}</small>}</span>
      {typeof l.premium === "number" && <span className="ma-line-cost">{amountOf(l.premium, hidden)} <small>{C.insurance.per[frequencyOf(l)]}</small></span>}
    </li>
  ))}</>;
}

/** a pension fund's cover: only the figures the fund reported, never a cost (it is part of the fund) */
function PensionLines({ p, hidden }: { p: PortfolioProduct; hidden: boolean }) {
  const pc = p.pension_cover;
  if (!pc) return null;
  const P = C.insurance.pension;
  const rows: [string, string][] = [];
  if (pc.disability_monthly || pc.disability_pct) {
    rows.push([P.disability, [pc.disability_monthly ? P.monthly(amountOf(pc.disability_monthly, hidden)) : "", pc.disability_pct ? P.ofSalary(plainPct(pc.disability_pct)) : ""].filter(Boolean).join(" · ")]);
  }
  if (pc.partner_pct) rows.push([P.partner, P.ofSalary(plainPct(pc.partner_pct))]);
  if (pc.orphan_pct) rows.push([P.orphan, P.ofSalary(plainPct(pc.orphan_pct))]);
  return <>{rows.map(([name, text]) => <li key={name}><span><b>{name}</b><small>{text}</small></span></li>)}</>;
}

export function Insurance() {
  const { portfolio, reloadPortfolio, hidden, requestsEnabled, openRequest } = useArea();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  const groups = useMemo(() => (portfolio.state === "ok"
    ? INSURANCE_KEYS.map((key) => ({ key, products: (portfolio.data.categories.find((c) => c.key === key)?.products ?? []).filter((p) => p.active !== false) }))
      .filter((g) => g.products.length > 0) : []), [portfolio]);
  const ov = useMemo(() => (portfolio.state === "ok" ? buildOverview(portfolio.data.categories, new Date()) : null), [portfolio]);
  const embedded = ov?.embedded ?? [];
  const shown = groups.length > 0 || embedded.length > 0;

  return (
    <div className="ma-stack">
      <div className="ma-greet">
        <h2 ref={heading} tabIndex={-1} className="ma-h1">{C.insurance.title}</h2>
      </div>
      {ov && ov.policiesActive > 0 && (
        <section className="ma-card ma-sum" aria-label={C.insurance.title}>
          <p className="ma-big">{amountOf(ov.monthlyPremium, hidden)} <small>{C.insurance.per.month}</small>
            {ov.yearlyPremium > 0 && <small className="ma-big-sub">{C.insurance.yearly(amountOf(ov.yearlyPremium, hidden))}</small>}
          </p>
          <p className="ma-muted">{C.insurance.count(ov.policiesActive)}</p>
        </section>
      )}
      {portfolio.state === "loading" && <CaLoading label={C.common.loading} tone="sage" />}
      {portfolio.state === "error" && <CaError title={portfolio.text} onRetry={reloadPortfolio} actionLabel={C.errors.retry} />}
      {portfolio.state === "ok" && !shown && <p className="sd-my-empty">{C.insurance.empty}</p>}
      {groups.map((g) => (
        <section key={g.key} className="ma-stack-s" aria-labelledby={`ma-ins-${g.key}`}>
          <h3 id={`ma-ins-${g.key}`} className="ma-group">{C.insurance.groups[g.key]}</h3>
          {g.products.map((p) => (
            <article key={p.id} className="ma-policy">
              <Head p={p} hidden={hidden} />
              {p.cover_lines && p.cover_lines.length > 0 ? (
                <ul className="ma-lines" aria-label={`${C.insurance.coversLabel}: ${p.type_label}`}>
                  <Lines label={p.id} lines={p.cover_lines} hidden={hidden} />
                </ul>
              ) : p.covers && p.covers.length > 0 && <p className="ma-covers">{p.covers.slice(0, 4).join(" · ")}{p.covers.length > 4 ? " …" : ""}</p>}
              {g.key === "insurance_general" && p.end && <p className="ma-ends">{C.insurance.ends(dateHe(p.end))}</p>}
            </article>
          ))}
        </section>
      ))}
      {embedded.length > 0 && (
        <section className="ma-stack-s" aria-labelledby="ma-ins-in">
          <h3 id="ma-ins-in" className="ma-group">{C.insurance.inSavingsTitle}</h3>
          {embedded.map((p) => {
            const has = !!p.pension_cover || (p.cover_lines?.length ?? 0) > 0;
            return (
              <article key={p.id} className="ma-policy">
                <Head p={{ ...p, premium: undefined }} hidden={hidden} />
                {has ? (
                  <ul className="ma-lines" aria-label={`${C.insurance.coversLabel}: ${p.type_label}`}>
                    <PensionLines p={p} hidden={hidden} />
                    {p.cover_lines && <Lines label={p.id} lines={p.cover_lines} hidden={hidden} />}
                  </ul>
                ) : <p className="ma-covers">{C.insurance.pension.unclear}</p>}
              </article>
            );
          })}
          <p className="ma-fine">{C.insurance.inSavingsNote}</p>
        </section>
      )}
      {ov && ov.policiesInactive > 0 && <p className="ma-muted">{C.insurance.inactiveMore(ov.policiesInactive)}</p>}
      {requestsEnabled && portfolio.state === "ok" && (
        <button type="button" className="ma-btn is-line is-wide" onClick={() => openRequest("insurance")}>{C.insurance.ask}</button>
      )}
      {shown && <p className="ma-disclaimer">{C.insurance.disclaimer}</p>}
    </div>
  );
}
