// Home (spec ס3): greeting, the data date, the portfolio at a glance (count per category) and the two ways onward.
// Below it the Har HaBituach card (spec ס7), shown only while the server switch is on.
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { ContactIcons } from "@/components/sd/ContactIcons";
import { MY_COPY as C } from "@/lib/client-area/copy";
import { MY_ROUTE } from "@/lib/client-area/config";
import type { ClientApi, MeRes } from "@/lib/client-area/api";
import { MyCard, dateHe } from "../parts";
import { HarbCard } from "./HarbCard";

export function Home({ me, api, onAuthLost }: { me: MeRes; api?: ClientApi; onAuthLost?: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  const cats = me.summary.categories.filter((c) => c.count > 0);
  return (
    <>
      <MyCard id="my-home" title={C.home.title(me.client.first_name)} headingRef={heading}>
        <p className="sd-q-hint">{C.home.lead}</p>
        {me.data_as_of && <p className="sd-my-asof">{C.home.asOf(dateHe(me.data_as_of))}</p>}
        {me.summary.products === 0 ? (
          <p className="sd-my-empty">{C.home.noData}</p>
        ) : (
          <>
            <h3 className="sd-my-h3">{C.home.summaryTitle} <span className="sd-my-count">{C.home.productsCount(me.summary.products)}</span></h3>
            <ul className="sd-my-tiles">
              {cats.map((c) => (
                <li key={c.key}>
                  <Link to={`${MY_ROUTE}/portfolio#${c.key}`} className="sd-my-tile">
                    <span className="sd-my-tile-n">{c.count}</span>
                    <span className="sd-my-tile-l">{C.portfolio.categories[c.key] ?? c.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="sd-my-actions">
          <Link to={`${MY_ROUTE}/portfolio`} className="sd-q-btn">{C.home.cta}<BrandIcon name="arrow-left" size={18} /></Link>
          <Link to={`${MY_ROUTE}/documents`} className="sd-q-btn is-quiet">{C.home.docsCta}</Link>
        </div>
        <div className="sd-my-contact">
          <p className="sd-q-sublabel">{C.common.contact}</p>
          <ContactIcons dept="general" tone="dark" />
        </div>
        <p className="sd-q-fine">{C.home.sessionLine(dateHe(me.session.expires_at))}</p>
      </MyCard>
      {api && onAuthLost && <HarbCard api={api} onAuthLost={onAuthLost} />}
    </>
  );
}
