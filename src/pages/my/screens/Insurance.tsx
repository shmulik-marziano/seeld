// Insurance (the "ביטוחים" tab): the live policies by group with the premium, the covers and, for home / car, the date the
// insurance period ends. No recommendation and no promise of handling (owner 2026-11-27): one action, a question to the agent.
import { useEffect, useMemo, useRef } from "react";
import { CaError, CaLoading } from "@/components/sd/client";
import { MY_COPY as C } from "@/lib/client-area/copy";
import { buildOverview, frequencyOf, INSURANCE_KEYS } from "@/lib/client-area/overview";
import { useArea } from "../context";
import { amountOf, dateHe } from "../parts";

const mono = (s: string) => s.trim().charAt(0) || "·";

export function Insurance() {
  const { portfolio, reloadPortfolio, hidden, requestsEnabled, openRequest } = useArea();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  const groups = useMemo(() => (portfolio.state === "ok"
    ? INSURANCE_KEYS.map((key) => ({ key, products: (portfolio.data.categories.find((c) => c.key === key)?.products ?? []).filter((p) => p.active !== false) }))
      .filter((g) => g.products.length > 0) : []), [portfolio]);
  const ov = useMemo(() => (portfolio.state === "ok" ? buildOverview(portfolio.data.categories, new Date()) : null), [portfolio]);

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
      {portfolio.state === "ok" && groups.length === 0 && <p className="sd-my-empty">{C.insurance.empty}</p>}
      {groups.map((g) => (
        <section key={g.key} className="ma-stack-s" aria-labelledby={`ma-ins-${g.key}`}>
          <h3 id={`ma-ins-${g.key}`} className="ma-group">{C.insurance.groups[g.key]}</h3>
          {g.products.map((p) => (
            <article key={p.id} className="ma-policy">
              <div className="ma-prod-head">
                <span className="ma-mono" aria-hidden="true">{mono(p.company_label)}</span>
                <span className="ma-prod-title"><b>{p.type_label}</b><small>{p.company_label}</small></span>
                {typeof p.premium === "number" && (
                  <span className="ma-premium"><b>{amountOf(p.premium, hidden)}</b><small>{C.insurance.per[frequencyOf(p)]}</small></span>
                )}
              </div>
              {p.covers && p.covers.length > 0 && <p className="ma-covers">{p.covers.slice(0, 4).join(" · ")}{p.covers.length > 4 ? " …" : ""}</p>}
              {g.key === "insurance_general" && p.end && <p className="ma-ends">{C.insurance.ends(dateHe(p.end))}</p>}
            </article>
          ))}
        </section>
      ))}
      {ov && ov.policiesInactive > 0 && <p className="ma-muted">{C.insurance.inactiveMore(ov.policiesInactive)}</p>}
      {requestsEnabled && portfolio.state === "ok" && (
        <button type="button" className="ma-btn is-line is-wide" onClick={() => openRequest("insurance")}>{C.insurance.ask}</button>
      )}
      {groups.length > 0 && <p className="ma-disclaimer">{C.insurance.disclaimer}</p>}
    </div>
  );
}
