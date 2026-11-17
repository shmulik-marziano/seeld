import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { SdCrumbs, SdPic, SdStageSpot, tintStyle, useSdFont } from "./primitives";
import type { ArtName, Pastel } from "./topics";
import "./sd.css";
import "./sd-pub.css";

export const Arrow = () => <BrandIcon name="arrow-left" size={18} />;

/** Page frame of the public pages: kit wrapper, tinted by the page's first colour, header and footer. */
export function PubPage({ tint, children }: { tint: Pastel; children: ReactNode }) {
  useSdFont();
  return (
    <div className="sd min-h-screen" dir="rtl" style={tintStyle(tint)}>
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

/** Hero: breadcrumb, eyebrow, the page's single h1, lead and actions beside the illustration stage. */
export function PubHero({ crumbs, eyebrow, title, lead, art, actions, extra }: {
  crumbs: { label: string; to?: string }[];
  eyebrow: string;
  title: string;
  lead: string;
  art: ArtName;
  actions?: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <section className="sd-hero">
      <div className="sd-wrap sd-hero-grid">
        <div className="sd-hero-copy">
          <SdCrumbs items={crumbs} />
          <span className="sd-eyebrow">{eyebrow}</span>
          <h1 className="sd-h1 mt-5">{title}</h1>
          <p className="sd-pub-lede">{lead}</p>
          {actions && <div className="sd-pub-actions">{actions}</div>}
          {extra}
        </div>
        <div className="sd-stage" aria-hidden="true">
          <SdPic name={art} sizes="(min-width:1024px) 520px, 90vw" priority />
          <SdStageSpot art={art} />
        </div>
      </div>
    </section>
  );
}

/** Navy closing block without a form: one invitation, two actions, an illustration. */
export function PubCta({ title, text, art, primary, secondary }: {
  title: string;
  text: string;
  art: ArtName;
  primary: { label: string; to: string };
  secondary?: { label: string; to: string };
}) {
  return (
    <section className="sd-pub-cta">
      <div className="sd-wrap sd-pub-cta-grid">
        <div>
          <h2 className="sd-h2">{title}</h2>
          <p className="sd-text">{text}</p>
          <div className="sd-pub-actions">
            <Link to={primary.to} className="sd-btn sd-btn-light">{primary.label}<Arrow /></Link>
            {secondary && <Link to={secondary.to} className="sd-link">{secondary.label}<Arrow /></Link>}
          </div>
        </div>
        <div className="sd-pub-cta-art" aria-hidden="true"><SdPic name={art} sizes="360px" /></div>
      </div>
    </section>
  );
}

/** Clean, readable wrapper for the legal and help pages. The legal text itself is passed in untouched. */
export function LegalFrame({ title, updated = "מרץ 2026", eyebrow = "מידע ושקיפות", art, tint, action, children }: {
  title: string;
  updated?: string;
  eyebrow?: string;
  art: ArtName;
  tint: Pastel;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <PubPage tint={tint}>
      <section className="sd-pub-legal-hero">
        <div className="sd-wrap">
          <div>
            <SdCrumbs items={[{ label: "דף הבית", to: "/" }, { label: title }]} />
            <span className="sd-eyebrow">{eyebrow}</span>
            <h1 className="sd-h1 mt-5" style={{ fontSize: "clamp(32px, 4.2vw, 52px)" }}>{title}</h1>
            <div className="sd-pub-legal-meta">
              <span>עודכן ב{updated}</span>
              {action}
            </div>
          </div>
          <div className="sd-pub-legal-art" aria-hidden="true"><SdPic name={art} sizes="280px" priority /></div>
        </div>
      </section>
      <div className="sd-pub-legal-sheet">{children}</div>
    </PubPage>
  );
}
