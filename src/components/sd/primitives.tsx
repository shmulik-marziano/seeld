import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { useActiveSection } from "@/components/inst/useActiveSection";
import { REGULATORY_LINE } from "@/lib/brand";
import { PASTELS, art3Of, art4Of, topicFor, type ArtName, type Pastel } from "./topics";
import { SdSpot } from "./SdSpot";
import { ContactIcons } from "./ContactIcons";
import { dividerFor, spotAt, type SpotName } from "./spots";
import type { Story } from "@/data/stories";
import "./sd.css";

/** Frank Ruhl Libre (headings). Linked at runtime so the CSP-allowed Google Fonts host is used once per page. */
const FONT_HREF = "https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@700&display=swap";
export function useSdFont() {
  useEffect(() => {
    if (!document.querySelector(`link[href="${FONT_HREF}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = FONT_HREF;
      document.head.appendChild(link);
    }
    return startRevealFallback();
  }, []);
}

/**
 * Reveal fallback for browsers without CSS scroll-driven animations. Only elements that are below the fold
 * when the page mounts get hidden (class sd-reveal-pre) and are shown by an IntersectionObserver, so nothing
 * is hidden without JS, in the prerendered HTML, or in browsers that already animate through CSS.
 */
function startRevealFallback() {
  if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (typeof CSS !== "undefined" && CSS.supports?.("animation-timeline: view()")) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      (e.target as HTMLElement).classList.add("is-in");
      io.unobserve(e.target);
    }
  }, { rootMargin: "0px 0px -8% 0px" });
  let raf = 0;
  const scan = () => {
    raf = 0;
    document.querySelectorAll<HTMLElement>(".sd-reveal:not([data-r])").forEach((el) => {
      el.dataset.r = "1";
      if (el.getBoundingClientRect().top > window.innerHeight * 0.92) {
        el.classList.add("sd-reveal-pre");
        io.observe(el);
      }
    });
  };
  const queue = () => { if (!raf) raf = requestAnimationFrame(scan); };
  queue();
  const mo = new MutationObserver(queue);
  mo.observe(document.body, { childList: true, subtree: true });
  return () => { mo.disconnect(); io.disconnect(); if (raf) cancelAnimationFrame(raf); };
}

/** Thin reading-progress line at the top of long content pages. Decorative; scaleX follows the scroll position. */
export function SdProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      el.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0})`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return <div className="sd-progress" aria-hidden="true"><div ref={ref} /></div>;
}

/**
 * Spots that orbit a hero stage (place inside .sd-stage): five spots at varied sizes and tilts around the arch,
 * mirrored left and right so the composition stays balanced. `name` (the page's own hero spot) goes first.
 */
export function SdStageSpot({ art, index = 0, name }: { art: ArtName | string; index?: number; name?: SpotName }) {
  const pool = [name ?? spotAt(art, index), spotAt(art, index + 1), spotAt(art, index + 2), spotAt(art, index + 3), spotAt(art, index + 4)];
  const extra: SpotName[] = ["olive-sapling", "seal-check", "pen", "shield-blue", "key-brass"];
  const names = [...new Set<SpotName>([...pool, ...extra])].slice(0, 5);
  const sizes = [124, 100, 92, 132, 108];
  return (
    <>
      {names.map((n, i) => (
        <SdSpot key={n} name={n} size={sizes[i]} className={`sd-orb sd-orb-${i + 1}`} style={{ ["--w" as string]: `${sizes[i]}px` }} />
      ))}
    </>
  );
}

/** Large decorative illustration layer that sits behind (and partly under) the content of a band, hero or closing block. */
export function SdArtLayer({ name, className = "sd-band-art" }: { name: ArtName | string; className?: string }) {
  return (
    <span className={className} aria-hidden="true">
      <SdPic name={name} sizes="(min-width:1024px) 640px, 92vw" />
    </span>
  );
}

const hash = (str: string) => [...str].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Decorative kit illustration: public/art/<name>-480.webp, -768.webp and -1536.webp. alt is empty on purpose (kit README). */
export function SdPic({ name, sizes, priority, className, style }: { name: ArtName | string; sizes: string; priority?: boolean; className?: string; style?: CSSProperties }) {
  return (
    <img
      src={`/art/${name}-768.webp`}
      srcSet={`/art/${name}-480.webp 480w, /art/${name}-768.webp 768w, /art/${name}-1536.webp 1536w`}
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

/** Band ids that get a fixed background illustration slot (others rotate through the topic arts). */
const BAND_ART: Record<string, "art" | "art2" | "art3" | "art4" | "art5"> = {
  moment: "art5", overview: "art3", guide: "art", checks: "art2", coverage: "art2", "product-types": "art2", process: "art", faq: "art5",
};

/**
 * Full-bleed colour strip. `tone` is one of the kit pastels, "cream" or "white".
 * Every band carries three decorative layers (all aria-hidden, pointer-events none, lazy): a big topic illustration behind
 * the text (opacity .15, fades toward the text), a ghost spot on the opposite side, and a spot that bleeds across the seam
 * to the previous band. Left/right alternate between bands (see .sd-band:nth-of-type in sd.css).
 * Props: `art` (a name, or false for no background illustration), `spot` (small corner spot, opt-in),
 * `divider` (seam spot: true/false or a name).
 */
export function SdBand({ tone, id, children, className = "", spot, divider, art: artProp }: {
  tone: Pastel | "cream" | "white"; id?: string; children: ReactNode; className?: string;
  spot?: SpotName | false; divider?: boolean | SpotName; art?: ArtName | false;
}) {
  const { pathname } = useLocation();
  const topic = topicFor(pathname);
  const art = topic.art;
  const h = hash(`${id ?? ""}${tone}`);
  const cornerName = spot || null; // corner spots are opt-in: a spot with no tie to the content looked orphaned
  const k = h % 3;
  const seamName: SpotName | null = divider === false ? null : typeof divider === "string" ? divider : k === 0 ? dividerFor(art, h >> 2) : spotAt(art, h >> 3);
  const seamSize = k === 0 || typeof divider === "string" ? 190 : 120;
  const slot = id ? BAND_ART[id] : undefined;
  const pool: ArtName[] = [art3Of(topic), topic.art5 ?? art, topic.art2, art4Of(topic)];
  const layerArt: ArtName | false = artProp === false ? false : artProp ?? (slot === "art" ? topic.art : slot === "art2" ? topic.art2 : slot === "art3" ? art3Of(topic) : slot === "art4" ? art4Of(topic) : slot === "art5" ? (topic.art5 ?? art3Of(topic)) : pool[h % pool.length]);
  const ghost = spotAt(layerArt || art, (h >> 5) + 2);
  return (
    <section id={id} className={`sd-band sd-band-${tone} scroll-mt-28 ${className}`}>
      {layerArt && <SdArtLayer name={layerArt} />}
      {layerArt && <span className="sd-band-ghost" aria-hidden="true"><SdSpot name={ghost} size={240} /></span>}
      {seamName && (
        <span className="sd-band-div" aria-hidden="true"><SdSpot name={seamName} size={seamSize} /></span>
      )}
      {cornerName && <span className="sd-band-corner" aria-hidden="true"><SdSpot name={cornerName} size={72} /></span>}
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
export function SdStory({ story, art, flip, spots }: { story: Story; art: ArtName; flip?: boolean; spots?: readonly [SpotName, SpotName] }) {
  const named = [spots?.[0] ?? spotAt(art, 1), spots?.[1] ?? spotAt(art, 2)];
  const more = [spotAt(art, 0), spotAt(art, 3), spotAt(art, 4)].filter((n) => !named.includes(n));
  const four = [...named, ...more].slice(0, 4);
  return (
    <div className="sd-wrap sd-story-grid">
      <div className={`sd-story-art sd-reveal ${flip ? "lg:order-2" : ""}`} aria-hidden="true">
        <SdPic name={art} sizes="(min-width:1024px) 560px, 96vw" />
        <SdSpot name={four[0]} size={104} className="sd-float sd-float-a" />
        <SdSpot name={four[1]} size={88} className="sd-float sd-float-b" />
        {four[2] && <SdSpot name={four[2]} size={72} className="sd-float sd-float-c" />}
        {four[3] && <SdSpot name={four[3]} size={80} className="sd-float sd-float-d" />}
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
  { icon: "handshake", t: "מחליטים יחד", p: "שיחת היכרות בלי התחייבות מצידכם. ההחלטה נשארת שלכם." },
];

export function SdProcess({ art, steps = DEFAULT_STEPS, title = "איך זה עובד", spot }: { art: ArtName; steps?: typeof DEFAULT_STEPS; title?: string; spot?: SpotName }) {
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
        <SdPic name={art} sizes="(min-width:1024px) 500px, 96vw" />
        <SdSpot name={spot ?? spotAt(art, 3)} size={96} className="sd-float sd-float-a" />
        <SdSpot name={spotAt(art, 1)} size={80} className="sd-float sd-float-b" />
        <SdSpot name={spotAt(art, 2)} size={68} className="sd-float sd-float-d" />
      </div>
    </div>
  );
}

/** Closing navy block: invitation, direct contact, illustration, and the form (children). */
export function SdContact({ id = "contact-form", title = "נשמח להכיר את התיק שלכם", text, art, spot, children }: { id?: string; title?: string; text?: string; art: ArtName; spot?: SpotName; children: ReactNode }) {
  const { pathname } = useLocation();
  const heroArt = topicFor(pathname).art;
  return (
    <section id={id} className="sd-contact scroll-mt-20">
      <SdArtLayer name={heroArt} className="sd-band-art sd-contact-layer" />
      <span className="sd-band-ghost sd-contact-ghost" aria-hidden="true"><SdSpot name={spotAt(art, 1)} size={220} /></span>
      <span className="sd-band-div sd-contact-seam" aria-hidden="true"><SdSpot name={spotAt(art, 0)} size={110} /></span>
      <div className="sd-wrap sd-contact-grid">
        <div>
          <h2 className="sd-h2">{title}</h2>
          <p className="sd-text mt-4">{text ?? "משאירים פרטים, ואנחנו חוזרים עם השוואה בין החברות בשוק. שיחת ההיכרות בלי התחייבות מצידכם."}</p>
          <div className="sd-reach mt-6">
            <ContactIcons tone="light" />
          </div>
          <div className="sd-contact-art" aria-hidden="true"><SdPic name={art} sizes="360px" /><SdSpot name={spot ?? spotAt(art, 2)} size={72} className="sd-float sd-float-b" /></div>
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
