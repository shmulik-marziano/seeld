// The general picture (spec ס3, the "תמונה כללית" tab), in the owner's order: the two answers first (how much money is saved,
// what is paid for insurance), then the protections with where each one comes from, then how the money splits; at most three
// plain notices (each with one action) and the request card. Everything comes from GET /portfolio (shell context); nothing
// here is computed beyond sums of reported figures (lib/client-area/overview.ts).
import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { CaError, CaLoading } from "@/components/sd/client";
import { ContactIcons } from "@/components/sd/ContactIcons";
import { MY_ROUTE } from "@/lib/client-area/config";
import { MY_COPY as C } from "@/lib/client-area/copy";
import { buildOverview, frequencyOf } from "@/lib/client-area/overview";
import { useArea } from "../context";
import { amountOf, dateHe } from "../parts";

const SPLIT_COLOR: Record<string, string> = { pension: "#7FA877", hishtalmut: "#C39A52", gemel: "#6F8DB5", savings: "#D4B37E" };

export function Home() {
  const { me, portfolio, reloadPortfolio, hidden, toggleHidden, requestsEnabled, openRequest } = useArea();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  const asOf = portfolio.state === "ok" ? portfolio.data.as_of : me.data_as_of;
  const ov = useMemo(() => (portfolio.state === "ok" ? buildOverview(portfolio.data.categories, new Date()) : null), [portfolio]);
  const prot = ov ? [...ov.protections].sort((a, b) => Number(b.exists) - Number(a.exists)) : [];

  return (
    <div className="ma-stack">
      <div className="ma-greet">
        <h2 ref={heading} tabIndex={-1} className="ma-h1">{C.home.title(me.client.first_name)}</h2>
        {asOf && <p className="ma-muted">{C.home.asOf(dateHe(asOf))}</p>}
      </div>

      {portfolio.state === "loading" && <CaLoading label={C.common.loading} tone="sage" />}
      {portfolio.state === "error" && <CaError title={portfolio.text} onRetry={reloadPortfolio} actionLabel={C.errors.retry} />}
      {ov && !ov.hasData && <p className="sd-my-empty">{C.home.noData}</p>}

      {ov && (ov.savingsTotal > 0 || ov.policiesActive > 0) && (
        <section className="ma-hero" aria-labelledby="ma-pic-h">
          <div className="ma-hero-top">
            <h3 id="ma-pic-h" className="ma-hero-title">{C.home.pictureTitle}</h3>
            <button type="button" className="ma-eye" onClick={toggleHidden} aria-pressed={hidden} aria-label={hidden ? C.common.showAmounts : C.common.hideAmounts}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
            </button>
          </div>
          {ov.savingsTotal > 0 && (
            <Link to={`${MY_ROUTE}/savings`} className="ma-hero-row">
              <span className="ma-hero-label">{C.home.moneyK}</span>
              <span className="ma-hero-num">{amountOf(ov.savingsTotal, hidden)}</span>
              <BrandIcon name="arrow-left" size={16} />
            </Link>
          )}
          {ov.policiesActive > 0 && (
            <Link to={`${MY_ROUTE}/insurance`} className="ma-hero-row">
              <span className="ma-hero-label">{C.home.insuranceK}
                {ov.yearlyPremium > 0 && <small>{C.home.plusYearly(amountOf(ov.yearlyPremium, hidden))}</small>}
              </span>
              <span className="ma-hero-num is-s">{amountOf(ov.monthlyPremium, hidden)} <small>{C.home.perMonth}</small></span>
              <BrandIcon name="arrow-left" size={16} />
            </Link>
          )}
        </section>
      )}

      {ov && ov.hasData && prot.length > 0 && (
        <section className="ma-card" aria-labelledby="ma-prot-h">
          <div className="ma-card-head">
            <h3 id="ma-prot-h" className="ma-h2">{C.home.protectionsTitle}</h3>
            <Link to={`${MY_ROUTE}/insurance`} className="ma-more">{C.home.toInsurance}<BrandIcon name="arrow-left" size={15} /></Link>
          </div>
          <ul className="ma-protl" aria-labelledby="ma-prot-h">
            {prot.map((p) => (
              <li key={p.key} className={p.exists ? "is-ok" : "is-off"}>
                <span className="ma-protl-ic" aria-hidden="true">{p.exists ? "✓" : ""}</span>
                <span className="ma-protl-t">
                  <b>{C.protections[p.key]}</b>
                  <small>{p.exists ? C.home.from(`${p.from[0].type_label} · ${p.from[0].company_label}`, p.from.length - 1) : C.home.notShown}</small>
                </span>
              </li>
            ))}
          </ul>
          <p className="ma-fine">{C.home.protectionsNote}</p>
        </section>
      )}

      {ov && ov.split.length > 0 && (
        <section className="ma-card" aria-labelledby="ma-money-h">
          <div className="ma-card-head">
            <h3 id="ma-money-h" className="ma-h2">{C.home.moneyTitle}</h3>
            <Link to={`${MY_ROUTE}/savings`} className="ma-more">{C.home.toSavings}<BrandIcon name="arrow-left" size={15} /></Link>
          </div>
          <div className="ma-bar" role="img" aria-label={ov.split.map((s) => `${C.savings.filters[s.key] ?? ""} ${s.pct}%`).join(", ")}>
            {ov.split.map((s) => <span key={s.key} style={{ width: `${Math.max(s.pct, 2)}%`, background: SPLIT_COLOR[s.key] }} />)}
          </div>
          <ul className="ma-legend">
            {ov.split.map((s) => (
              <li key={s.key}><span><i style={{ background: SPLIT_COLOR[s.key] }} />{C.savings.filters[s.key]}</span><b>{amountOf(s.amount, hidden)}</b></li>
            ))}
          </ul>
        </section>
      )}

      {ov && ov.notices.length > 0 && (
        <section className="ma-stack-s" aria-labelledby="ma-notes-h">
          <h3 id="ma-notes-h" className="ma-h2">{C.home.noticesTitle}</h3>
          {ov.notices.map((n) => n.kind === "ending" ? (
            <article key={n.product.id} className="ma-note">
              <span className="ma-note-ic is-gold" aria-hidden="true"><BrandIcon name="calendar" size={20} /></span>
              <div className="ma-note-body">
                <h4>{C.home.ending(n.product.type_label, dateHe(n.product.end))}</h4>
                <p>{n.product.company_label}{typeof n.product.premium === "number" ? ` · ${amountOf(n.product.premium, hidden)} ${C.insurance.per[frequencyOf(n.product)]}` : ""}. {C.home.endingText}</p>
                {requestsEnabled && <button type="button" className="ma-btn is-line is-s" onClick={() => openRequest("insurance")}>{C.home.askCta}</button>}
              </div>
            </article>
          ) : (
            <article key="inactive" className="ma-note">
              <span className="ma-note-ic" aria-hidden="true"><BrandIcon name="folder" size={20} /></span>
              <div className="ma-note-body">
                <h4>{C.home.inactiveEmpty(n.count)}</h4>
                <p>{C.home.inactiveEmptyText}</p>
                <Link to={`${MY_ROUTE}/savings?f=gemel`} className="ma-btn is-line is-s">{C.home.view}</Link>
              </div>
            </article>
          ))}
        </section>
      )}

      <section className="ma-ask" aria-labelledby="ma-ask-h">
        <div>
          <h3 id="ma-ask-h" className="ma-h3">{C.home.askTitle}</h3>
          <p>{C.home.askText}</p>
        </div>
        {requestsEnabled
          ? <button type="button" className="ma-btn" onClick={() => openRequest(null)}>{C.home.askCta}</button>
          : requestsEnabled === false && <ContactIcons dept="general" tone="dark" />}
      </section>

      <p className="ma-disclaimer">{C.home.disclaimer}</p>
    </div>
  );
}
