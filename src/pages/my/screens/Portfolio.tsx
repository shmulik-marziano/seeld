// Savings (spec ס4, the "חסכונות" tab; this file kept its first name): filter chips by kind, one card per product (balance,
// the year's return as the fund reported it, fees, last deposit) and a sheet with the facts and one action: a question about
// this product to the agent. The data is the shell's GET /portfolio.
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CaError, CaLoading } from "@/components/sd/client";
import { MY_COPY as C } from "@/lib/client-area/copy";
import type { CategoryKey } from "@/lib/client-area/config";
import type { PortfolioProduct } from "@/lib/client-area/api";
import { SAVINGS_KEYS } from "@/lib/client-area/overview";
import { useArea } from "../context";
import { amountOf, dateHe, monthHe, plainPct, Sheet, signedPct } from "../parts";

const mono = (s: string) => s.trim().charAt(0) || "·";

function feeLine(p: PortfolioProduct): string {
  const parts: string[] = [];
  if (typeof p.fee_balance_pct === "number") parts.push(C.savings.feeBalance(plainPct(p.fee_balance_pct)));
  if (typeof p.fee_deposit_pct === "number") parts.push(C.savings.feeDeposit(plainPct(p.fee_deposit_pct)));
  return parts.join(" · ");
}

function ProductSheet({ p, asOf, onClose }: { p: PortfolioProduct; asOf: string | null; onClose: () => void }) {
  const { hidden, requestsEnabled, openRequest } = useArea();
  const F = C.product.facts;
  const facts: [string, string][] = [];
  if (p.track) facts.push([F.track, p.track]);
  if (typeof p.fee_balance_pct === "number") facts.push([F.feeBalance, plainPct(p.fee_balance_pct)]);
  if (typeof p.fee_deposit_pct === "number") facts.push([F.feeDeposit, plainPct(p.fee_deposit_pct)]);
  if (p.last_deposit) facts.push([F.lastDeposit, monthHe(p.last_deposit)]);
  if (p.status) facts.push([F.status, p.status]);
  if (C.product.sources[p.source]) facts.push([F.source, C.product.sources[p.source]]);
  return (
    <Sheet label={C.product.label} onClose={onClose}>
      <div className="ma-sheet-head">
        <span className="ma-mono" aria-hidden="true">{mono(p.company_label)}</span>
        <div>
          <h2 className="ma-h2">{p.type_label}</h2>
          <p className="ma-muted">{p.company_label}{p.policy_number_masked ? <> · <bdi>{p.policy_number_masked}</bdi></> : null}</p>
        </div>
      </div>
      {typeof p.balance === "number" && (
        <div className="ma-sheet-num">
          <span className="ma-muted">{asOf ? C.product.balanceAsOf(dateHe(asOf)) : C.product.balance}</span>
          <b>{amountOf(p.balance, hidden)}</b>
        </div>
      )}
      {facts.length > 0 && (
        <dl className="ma-facts">
          {facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
        </dl>
      )}
      {requestsEnabled && <button type="button" className="ma-btn is-wide" onClick={() => { onClose(); openRequest("savings"); }}>{C.product.ask}</button>}
    </Sheet>
  );
}

export function Savings() {
  const { portfolio, reloadPortfolio, hidden } = useArea();
  const heading = useRef<HTMLHeadingElement>(null);
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState<PortfolioProduct | null>(null);
  useEffect(() => { heading.current?.focus(); }, []);

  const cats = useMemo(() => (portfolio.state === "ok"
    ? portfolio.data.categories.filter((c) => SAVINGS_KEYS.includes(c.key) && c.products.length > 0) : []), [portfolio]);
  const all = cats.flatMap((c) => c.products.map((p) => ({ ...p, cat: c.key })));
  const asked = params.get("f") as CategoryKey | null;
  const filter: CategoryKey | "all" = asked && cats.some((c) => c.key === asked) ? asked : "all";
  const shown = filter === "all" ? all : all.filter((p) => p.cat === filter);
  const total = all.reduce((n, p) => n + (typeof p.balance === "number" && p.balance > 0 ? p.balance : 0), 0);
  const asOf = portfolio.state === "ok" ? portfolio.data.as_of : null;

  return (
    <div className="ma-stack">
      <div className="ma-greet">
        <h2 ref={heading} tabIndex={-1} className="ma-h1">{C.savings.title}</h2>
        {portfolio.state === "ok" && all.length > 0 && <p className="ma-muted">{amountOf(total, hidden)}{asOf ? ` · ${C.savings.asOf(dateHe(asOf))}` : ""}</p>}
      </div>
      {portfolio.state === "loading" && <CaLoading label={C.common.loading} tone="sage" />}
      {portfolio.state === "error" && <CaError title={portfolio.text} onRetry={reloadPortfolio} actionLabel={C.errors.retry} />}
      {portfolio.state === "ok" && all.length === 0 && <p className="sd-my-empty">{C.savings.empty}</p>}
      {cats.length > 1 && (
        <div className="ma-chips" role="group" aria-label={C.savings.filterLabel}>
          <button type="button" aria-pressed={filter === "all"} onClick={() => setParams({}, { replace: true })}>{C.savings.all} <span>{all.length}</span></button>
          {cats.map((c) => (
            <button key={c.key} type="button" aria-pressed={filter === c.key} onClick={() => setParams({ f: c.key }, { replace: true })}>
              {C.savings.filters[c.key] ?? c.label} <span>{c.products.length}</span>
            </button>
          ))}
        </div>
      )}
      <ul className="ma-list">
        {shown.map((p) => (
          <li key={p.id}>
            <button type="button" className="ma-prod" onClick={() => setOpen(p)}>
              <span className="ma-prod-head">
                <span className="ma-mono" aria-hidden="true">{mono(p.company_label)}</span>
                <span className="ma-prod-title">
                  <b>{p.type_label}</b>
                  <small>{p.company_label}{p.policy_number_masked ? <> · <bdi>{p.policy_number_masked}</bdi></> : null}</small>
                </span>
                <b className={p.active !== false ? "ma-pill is-ok" : "ma-pill"}>{p.active !== false ? C.savings.active : C.savings.inactive}</b>
              </span>
              <span className="ma-prod-num">
                <b>{typeof p.balance === "number" ? amountOf(p.balance, hidden) : ""}</b>
                {typeof p.ytd_return_pct === "number" && <small className={p.ytd_return_pct >= 0 ? "is-up" : "is-down"}><bdi>{C.savings.ytd(signedPct(p.ytd_return_pct))}</bdi></small>}
              </span>
              {(feeLine(p) || p.last_deposit) && (
                <span className="ma-prod-foot">
                  {feeLine(p) && <span>{feeLine(p)}</span>}
                  {p.last_deposit && <span>{C.savings.lastDeposit(monthHe(p.last_deposit))}</span>}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      {all.length > 0 && <p className="ma-disclaimer">{C.savings.disclaimer}</p>}
      {open && <ProductSheet p={open} asOf={asOf} onClose={() => setOpen(null)} />}
    </div>
  );
}
