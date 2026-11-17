import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { PubPage, Arrow } from "@/components/sd/pubParts";
import { SdBand, SdIcon, SdPic } from "@/components/sd/primitives";
import "@/components/sd/client.css";

// 404: airy, one illustration, the way home and four ways on.

const WAYS = [
  { to: "/insurances", icon: "shield", t: "ביטוח", p: "חיים, בריאות, רכב, דירה ועוד" },
  { to: "/savings", icon: "wallet", t: "חיסכון ופנסיה", p: "קרנות, קופות ותכנון לטווח ארוך" },
  { to: "/calculators", icon: "checklist", t: "מחשבונים", p: "בדיקה מהירה לפני שמדברים" },
  { to: "/learn", icon: "search", t: "מידע ולמידה", p: "מדריכים בשפה פשוטה" },
];

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <PubPage tint="butter">
      <section className="sd-hero">
        <div className="sd-wrap sd-hero-grid">
          <div className="sd-hero-copy">
            <span className="sd-eyebrow">שגיאה <span dir="ltr">404</span></span>
            <h1 className="sd-h1 mt-5">העמוד הזה לא נמצא, אבל אנחנו כאן.</h1>
            <p className="sd-pub-lede">
              ייתכן שהקישור השתנה או שהכתובת הוקלדה בטעות. אפשר לחזור לדף הבית, או לכתוב לנו ונעזור למצוא את מה שחיפשתם.
            </p>
            <div className="sd-pub-actions">
              <Link to="/" className="sd-btn">לדף הבית<Arrow /></Link>
              <Link to="/contact" className="sd-link">דברו איתנו<Arrow /></Link>
            </div>
          </div>
          <div className="sd-stage" aria-hidden="true">
            <SdPic name="01-hero" sizes="(min-width:1024px) 520px, 90vw" priority />
          </div>
        </div>
      </section>

      <SdBand tone="sage">
        <div className="sd-wrap">
          <div className="sd-band-head">
            <h2 className="sd-h2">אולי חיפשתם את אחד מאלה</h2>
          </div>
          <ul className="sd-ca-agents-grid c4">
            {WAYS.map((w) => (
              <li key={w.to}>
                <Link to={w.to} className="sd-ca-feature block h-full">
                  <SdIcon name={w.icon} size={52} />
                  <h3 className="sd-h3 mt-3">{w.t}</h3>
                  <p>{w.p}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </SdBand>
    </PubPage>
  );
};

export default NotFound;
