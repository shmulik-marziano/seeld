import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { ContactIcons } from "@/components/sd/ContactIcons";
import { SdArtLayer, SdPic } from "@/components/sd/primitives";
import { SdSpot } from "@/components/sd/SdSpot";
import { spotAt } from "@/components/sd/spots";
import type { ArtName } from "@/components/sd/topics";
import { ENTRY_CARDS, RP, RP_CONTACT, RP_PAGES, RP_REG_LINE, type Faq } from "@/data/retirementPlanning";
import "./retire.css";

export const Arrow = () => <BrandIcon name="arrow-left" size={18} />;

/** Regulatory line: the bottom of every page of the section. */
export function RpRegLine() {
  return (
    <div className="sd-rp-reg">
      <div className="sd-wrap"><p>{RP_REG_LINE}</p></div>
    </div>
  );
}

/** Pills that move between the five pages of the section. */
export function RpPageNav() {
  const { pathname } = useLocation();
  const here = pathname.replace(/\/$/, "");
  return (
    <nav className="sd-rp-nav" aria-label="עמודי תכנון פרישה">
      <div className="sd-wrap sd-rp-nav-in">
        {RP_PAGES.map((p) => (
          <Link key={p.to} to={p.to} aria-current={here === p.to ? "page" : undefined}>{p.label}</Link>
        ))}
      </div>
    </nav>
  );
}

/** Entry cards: the situations people arrive from. Each opens the form with a preset (query values, never personal data). */
export function RpEntryCards({ to = RP, cardHash = "#form" }: { to?: string; cardHash?: string }) {
  return (
    <ul className="sd-rp-entries">
      {ENTRY_CARDS.map((c) => {
        const qs = new URLSearchParams({ concern: c.concern, ...(c.situation ? { situation: c.situation } : {}) }).toString();
        return (
          <li key={c.title}>
            <Link to={`${to}?${qs}${cardHash}`} className="sd-rp-entry">
              <b>{c.title}</b>
              <span>{c.text}</span>
              <i className="sd-rp-entry-go">לשיחת היכרות<Arrow /></i>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Accordion of questions. Every answer ends with a link to the intro call; all text is in the DOM for the prerender. */
export function RpFaqList({ items, openFirst = true }: { items: Faq[]; openFirst?: boolean }) {
  return (
    <div className="sd-faq">
      {items.map((f, i) => (
        <details key={f.q} open={openFirst && i === 0}>
          <summary>{f.q}</summary>
          <div>
            <p>{f.a}</p>
            <Link to={RP_CONTACT} className="sd-rp-faq-link">לתיאום שיחת היכרות<Arrow /></Link>
          </div>
        </details>
      ))}
    </div>
  );
}

/** Cross-link card for the neighbouring savings pages (pre- and post-retirement). */
export function RpCrossLink() {
  return (
    <Link to={RP} className="sd-rp-cross">
      <small>תכנון פרישה</small>
      <b>אפיון צרכים ותמונה אחת של הקופות והמשפחה</b>
      <span>כרטיס לכל קופה ופוליסה, החלטות בכתב וביצוע מדורג, בשיחת היכרות ראשונה בלי התחייבות.</span>
      <i>לתכנון פרישה<Arrow /></i>
    </Link>
  );
}

/** Navy closing block: invitation, direct contact, illustration, and the regulatory line. */
export function RpClose({ title, text, art, children }: { title: string; text: string; art: ArtName; children?: ReactNode }) {
  return (
    <section className="sd-contact sd-pub-close no-print">
      <SdArtLayer name={art} className="sd-band-art sd-contact-layer" />
      <span className="sd-band-ghost sd-contact-ghost" aria-hidden="true"><SdSpot name={spotAt(art, 1)} size={220} /></span>
      <span className="sd-band-div sd-contact-seam" aria-hidden="true"><SdSpot name={spotAt(art, 0)} size={110} /></span>
      <div className="sd-wrap sd-pub-close-grid">
        <div>
          <h2 className="sd-h2">{title}</h2>
          <p className="sd-text mt-4">{text}</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link to={RP_CONTACT} className="sd-btn sd-btn-light">שיחת היכרות ראשונה, בלי התחייבות<Arrow /></Link>
            {children}
          </div>
          <div className="sd-reach mt-6"><ContactIcons tone="light" /></div>
        </div>
        <div className="sd-contact-art" aria-hidden="true"><SdPic name={art} sizes="360px" /></div>
      </div>
    </section>
  );
}
