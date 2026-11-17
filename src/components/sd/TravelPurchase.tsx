import "./travel-purchase.css";

/*
  TravelPurchase — one card per insurer. A click on the logo opens that insurer's own
  digital purchase flow in a new tab (the agency's link, so the policy is tied to the agency).
  Insurers whose links are not ready yet are shown quietly as "בקרוב".
  To add an insurer: put its link in `href` and remove `soon`.
*/

type Partner = {
  slug: string;
  name: string;
  logo: string;
  w: number;
  h: number;
  href?: string;
  soon?: boolean;
};

const PARTNERS: Partner[] = [
  {
    slug: "harel", name: "הראל", logo: "/logos/harel.svg", w: 125, h: 47,
    href: "https://digital.harel-group.co.il/travel-policy?guid=bee1d408-c6a7-410e-b4ee-ac690224bdd3&an=025318",
  },
  {
    slug: "migdal", name: "מגדל", logo: "/logos/migdal.png", w: 500, h: 180,
    href: "https://sites.migdal.co.il/NahalApp/#/nahal/newPolicy/firstStep?id=2120",
  },
  {
    slug: "clal", name: "כלל", logo: "/logos/clal.svg", w: 164, h: 60,
    href: "https://www.clalbit.co.il/travelingisurance/claltravel/?txtCompID=1",
  },
  {
    slug: "passportcard", name: "פספורט קארד", logo: "/logos/passportcard.png", w: 500, h: 350,
    href: "https://buy.passportcard.co.il/?AffiliateId=fOYE25Ik9VYSMk30irogAg%3D%3D",
  },
  { slug: "phoenix", name: "הפניקס", logo: "/logos/phoenix.svg", w: 387, h: 132, soon: true },
  { slug: "menora", name: "מנורה מבטחים", logo: "/logos/menora.png", w: 150, h: 46, soon: true },
];

export default function TravelPurchase() {
  return (
    <section id="travel-purchase" className="sd-tp" aria-labelledby="sd-tp-title">
      <div className="sd-tp-head">
        <span className="sd-eyebrow">רכישה דיגיטלית</span>
        <h2 id="sd-tp-title" className="sd-h2">בוחרים חברה ומתחילים ברכישה</h2>
        <p className="sd-tp-lead">
          לחיצה על הלוגו פותחת את הרכישה הדיגיטלית באתר חברת הביטוח, בלשונית חדשה. אפשר להשוות בין החברות, ואנחנו כאן לכל שאלה לפני ואחרי.
        </p>
      </div>
      <ul className="sd-tp-grid">
        {PARTNERS.map((p) => (
          <li key={p.slug}>
            {p.href && !p.soon ? (
              <a
                className="sd-tp-card"
                href={p.href}
                target="_blank"
                rel="noopener noreferrer sponsored"
                aria-label={`רכישת ביטוח נסיעות ב${p.name}, נפתח בלשונית חדשה`}
              >
                <span className="sd-tp-logo"><img src={p.logo} alt="" width={p.w} height={p.h} loading="lazy" draggable={false} /></span>
                <span className="sd-tp-name">{p.name}</span>
                <span className="sd-tp-go">
                  לרכישה
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
                </span>
              </a>
            ) : (
              <div className="sd-tp-card sd-tp-soon" aria-label={`${p.name}, בקרוב`}>
                <span className="sd-tp-logo"><img src={p.logo} alt="" width={p.w} height={p.h} loading="lazy" draggable={false} /></span>
                <span className="sd-tp-name">{p.name}</span>
                <span className="sd-tp-go">בקרוב</span>
              </div>
            )}
          </li>
        ))}
      </ul>
      <p className="sd-tp-or" aria-hidden="true"><span>לא בטוחים איזו חברה מתאימה?</span></p>
      <a
        className="sd-tp-smart"
        href="https://quweb.co.il/quote"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="השוואה חכמה של ביטוחי נסיעות ב-QUWEB, נפתח בלשונית חדשה"
      >
        <img src="/logos/quweb-globe.svg" alt="" width={64} height={64} loading="lazy" draggable={false} />
        <span className="sd-tp-smart-txt">
          <strong>השוואה חכמה</strong>
          <span>מחירים וכיסויים של כל החברות במקום אחד, וממשיכים לרכישה</span>
        </span>
      </a>
    </section>
  );
}
