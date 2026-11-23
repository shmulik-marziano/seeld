// Portfolio (spec ס4): one section per category, one row per product; a row opens its details (native details element).
import { useEffect, useRef, useState } from "react";
import { CaError, CaLoading } from "@/components/sd/client";
import { MY_COPY as C } from "@/lib/client-area/copy";
import { type ClientApi, errorKindOf, type PortfolioProduct, type PortfolioRes } from "@/lib/client-area/api";
import { MyCard, dateHe, money } from "../parts";

function Row({ p }: { p: PortfolioProduct }) {
  const L = C.portfolio.labels;
  const period = p.start || p.end ? `${dateHe(p.start) || "…"} – ${dateHe(p.end) || "…"}` : null;
  const freq = p.premium_frequency ? C.portfolio.frequency[p.premium_frequency] ?? p.premium_frequency : "";
  return (
    <details className="sd-my-row">
      <summary>
        <span className="sd-my-row-main">
          <span className="sd-my-row-title">{p.type_label}</span>
          <span className="sd-my-row-sub">{p.company_label}{p.policy_number_masked ? ` · ${p.policy_number_masked}` : ""}</span>
        </span>
        <span className="sd-my-row-num" dir="ltr">
          {typeof p.balance === "number" ? money(p.balance) : typeof p.coverage === "number" ? money(p.coverage) : typeof p.premium === "number" ? money(p.premium) : ""}
        </span>
      </summary>
      <dl className="sd-poa-rows sd-my-rows">
        <div><dt>{L.company}</dt><dd>{p.company_label}</dd></div>
        {p.policy_number_masked && <div><dt>{L.policy}</dt><dd dir="ltr">{p.policy_number_masked}</dd></div>}
        {typeof p.balance === "number" && <div><dt>{L.balance}</dt><dd dir="ltr">{money(p.balance)}</dd></div>}
        {typeof p.premium === "number" && <div><dt>{L.premium}</dt><dd dir="ltr">{money(p.premium)} {freq}</dd></div>}
        {typeof p.coverage === "number" && <div><dt>{L.coverage}</dt><dd dir="ltr">{money(p.coverage)}</dd></div>}
        {p.track && <div><dt>{L.track}</dt><dd>{p.track}</dd></div>}
        {period && <div><dt>{L.period}</dt><dd dir="ltr">{period}</dd></div>}
        {p.status && <div><dt>{L.status}</dt><dd>{p.status}</dd></div>}
        <div><dt>{L.source}</dt><dd>{C.portfolio.sources[p.source] ?? p.source}</dd></div>
      </dl>
    </details>
  );
}

export function Portfolio({ api, onAuthLost }: { api: ClientApi; onAuthLost: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [data, setData] = useState<PortfolioRes | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => { heading.current?.focus(); }, []);
  useEffect(() => {
    let live = true;
    setErr(null);
    api.portfolio().then((r) => { if (live) setData(r); }, (e) => {
      if (!live) return;
      if (errorKindOf(e) === "unauthenticated") onAuthLost(); else setErr(errorKindOf(e) === "unavailable" ? C.errors.unavailable : C.errors.generic);
    });
    return () => { live = false; };
  }, [api, tick, onAuthLost]);

  const cats = data?.categories.filter((c) => c.products.length > 0) ?? [];
  return (
    <MyCard id="my-portfolio" title={C.portfolio.title} headingRef={heading}
      aside={data?.as_of ? <p className="sd-my-asof">{C.home.asOf(dateHe(data.as_of))}</p> : undefined}>
      <p className="sd-q-hint">{C.portfolio.lead}</p>
      {err && <CaError title={err} onRetry={() => setTick((t) => t + 1)} actionLabel={C.errors.retry} />}
      {!err && !data && <CaLoading label={C.common.loading} tone="sage" />}
      {data && cats.length === 0 && <p className="sd-my-empty">{C.portfolio.empty}</p>}
      {cats.map((c) => (
        <section key={c.key} id={c.key} className="sd-my-cat" aria-labelledby={`my-cat-${c.key}`}>
          <h3 id={`my-cat-${c.key}`} className="sd-my-h3">{C.portfolio.categories[c.key] ?? c.label} <span className="sd-my-count">{c.products.length}</span></h3>
          {c.products.map((p) => <Row key={p.id} p={p} />)}
        </section>
      ))}
    </MyCard>
  );
}
