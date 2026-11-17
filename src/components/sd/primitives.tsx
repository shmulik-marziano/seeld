import { useEffect, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { useActiveSection } from "@/components/inst/useActiveSection";
import { REGULATORY_LINE } from "@/lib/brand";
import { PASTELS, type ArtName, type Pastel } from "./topics";
import type { Story } from "@/data/stories";
import "./sd.css";

/** Frank Ruhl Libre (headings). Linked at runtime so the CSP-allowed Google Fonts host is used once per page. */
const FONT_HREF = "https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@700&display=swap";
export function useSdFont() {
  useEffect(() => {
    if (document.querySelector(`link[href="${FONT_HREF}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }, []);
}

/** Decorative kit illustration: public/art/<name>-768.webp and -1536.webp. alt is empty on purpose (kit README). */
export function SdPic({ name, sizes, priority, className, style }: { name: ArtName | string; sizes: string; priority?: boolean; className?: string; style?: CSSProperties }) {
  return (
    <img
      src={`/art/${name}-768.webp`}
      srcSet={`/art/${name}-768.webp 768w, /art/${name}-1536.webp 1536w`}
      sizes={sizes}
      width={768}
      height={512}
      alt=""
      decoding="async"
      loading={priority ? "eager" : "lazy"}
      {...(priority ? { fetchPriority: "high" as const } : {})}
      className={className}
      style={style}
    />
  );
}

/** Kit colour icon (public/art/icons/<name>.svg): shield, handshake, search, checklist, lock, hourglass, phone, email. */
export const SdIcon = ({ name, size = 40 }: { name: string; size?: number }) => (
  <img src={`/art/icons/${name}.svg`} alt="" width={size} height={size} loading="lazy" />
);

/** Full-bleed colour strip. `tone` is one of the kit pastels, "cream" or "white". */
export function SdBand({ tone, id, children, className = "" }: { tone: Pastel | "cream" | "white"; id?: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`sd-band sd-band-${tone} scroll-mt-28 ${className}`}>
      {children}
    </section>
  );
}

/** Sticky pill navigation to the sections of a page. */
export function SdSubnav({ sections }: { sections: { id: string; label: string }[] }) {
  const active = useActiveSection(sections.map((s) => s.id));
  return (
    <nav className="sd-subnav" aria-label="תוכן העמוד">
      <div className="sd-wrap sd-subnav-in">
        {sections.map((s) => (
          <a key={s.id} href={`#${s.id}`} aria-current={active === s.id ? "true" : undefined}>{s.label}</a>
        ))}
      </div>
    </nav>
  );
}

/** The emotional moment: illustration + what stands in front of the reader. Goes inside an SdBand. */
export function SdStory({ story, art, flip }: { story: Story; art: ArtName; flip?: boolean }) {
  return (
    <div className="sd-wrap sd-story-grid">
      <div className={`sd-story-art sd-reveal ${flip ? "lg:order-2" : ""}`} aria-hidden="true">
        <SdPic name={art} sizes="(min-width:1024px) 480px, 90vw" />
      </div>
      <div>
        <span className="sd-eyebrow">{story.kicker}</span>
        <h2 className="sd-h2 mt-4">{story.title}</h2>
        <p className="sd-lead mt-5">{story.body}</p>
        <ul className="sd-moments">
          {story.moments.map((m, i) => (
            <li key={i} className="sd-moment"><i>{i + 1}</i><span>{m}</span></li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Three-step "how it works" with kit icons. Steps are generic and true for every product page. */
export const DEFAULT_STEPS = [
  { icon: "checklist", t: "משאירים פרטים", p: "ממלאים טופס קצר או מתקשרים. מספרים לנו מה יש היום ומה חשוב לכם." },
  { icon: "search", t: "אנחנו משווים", p: "בודקים את הכיסויים והמחירים בין החברות בשוק ומציגים את ההבדלים בצורה ברורה." },
  { icon: "handshake", t: "מחליטים יחד", p: "הפגישה הראשונה ללא עלות ואינה מחייבת. ההחלטה תמיד שלכם." },
];

export function SdProcess({ art, steps = DEFAULT_STEPS, title = "איך זה עובד" }: { art: ArtName; steps?: typeof DEFAULT_STEPS; title?: string }) {
  return (
    <div className="sd-wrap sd-process-grid">
      <div>
        <h2 className="sd-h2" style={{ marginBottom: 28 }}>{title}</h2>
        <ol className="sd-steps">
          {steps.map((s, i) => (
            <li key={s.t} className="sd-step sd-reveal">
              <small>{String(i + 1).padStart(2, "0")}</small>
              <SdIcon name={s.icon} size={56} />
              <div><h3 className="sd-h3">{s.t}</h3><p>{s.p}</p></div>
            </li>
          ))}
        </ol>
      </div>
      <div className="sd-story-art sd-reveal" aria-hidden="true">
        <SdPic name={art} sizes="(min-width:1024px) 440px, 90vw" />
      </div>
    </div>
  );
}

/** Closing navy block: invitation, direct contact, illustration, and the form (children). */
export function SdContact({ id = "contact-form", title = "נשמח להכיר את התיק שלכם", text, art, children }: { id?: string; title?: string; text?: string; art: ArtName; children: ReactNode }) {
  return (
    <section id={id} className="sd-contact scroll-mt-20">
      <div className="sd-wrap sd-contact-grid">
        <div>
          <h2 className="sd-h2">{title}</h2>
          <p className="sd-text mt-4">{text ?? "משאירים פרטים, ואנחנו חוזרים עם השוואה בין החברות בשוק. הפגישה הראשונה ללא עלות ואינה מחייבת."}</p>
          <div className="sd-reach mt-6">
            <a href="tel:0523097444" dir="ltr" style={{ justifyContent: "flex-end" }}>052-309-7444</a>
            <a href="mailto:info@seeld.co.il" dir="ltr" style={{ justifyContent: "flex-end" }}>info@seeld.co.il</a>
          </div>
          <div className="sd-contact-art" aria-hidden="true"><SdPic name={art} sizes="360px" /></div>
          <p className="sd-small mt-8">{REGULATORY_LINE}</p>
        </div>
        <div className="sd-form">{children}</div>
      </div>
    </section>
  );
}

/** Breadcrumb used by the page heroes. */
export function SdCrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="פירורי לחם" className="sd-crumbs mb-6">
      {items.map((it, i) => (
        <span key={it.label} className="inline-flex items-center gap-2">
          {i > 0 && <BrandIcon name="arrow-left" size={12} />}
          {it.to ? <Link to={it.to}>{it.label}</Link> : <span aria-current="page" className="font-bold" style={{ color: "var(--ink)" }}>{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}

/** Inline style that applies a topic's first colour to the hero stage and the page tint. */
export const tintStyle = (p: Pastel) => ({ ["--tint" as string]: PASTELS[p].bg, ["--tint-deep" as string]: PASTELS[p].deep }) as CSSProperties;
