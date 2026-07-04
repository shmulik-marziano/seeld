import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { BONE, PINE, BRONZE, SERIF } from "@/lib/brand";

const About = () => {
  return (
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: BONE }}>
      <Header />

      {/* ══════ HERO ══════ */}
      <section style={{ backgroundColor: BONE }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-12 sm:pb-16">
          {/* Rule + breadcrumb */}
          <div className="border-t border-[#1a1a18]/20 pt-5 mb-10 sm:mb-14 flex items-baseline justify-between gap-4">
            <nav className="flex items-center gap-2 text-[12px] text-[#1a1a18]/40">
              <Link to="/" className="hover:text-[#1a1a18] transition-colors">דף הבית</Link>
              <span>←</span>
              <span className="text-[#1a1a18]/70 font-medium">אודות</span>
            </nav>
            <span className="hidden sm:inline text-[11px] tracking-[0.22em] font-medium" style={{ color: BRONZE }}>
              הבית
            </span>
          </div>

          <h1
            className="text-[#1a1a18] leading-[1.15] mb-6 max-w-3xl"
            style={{ fontFamily: SERIF, fontWeight: 400, fontSize: "clamp(2rem, 5vw, 3.4rem)" }}
          >
            אודות SEELD
          </h1>
          <p className="text-[15px] sm:text-[17px] text-[#1a1a18]/55 max-w-2xl leading-[1.9]">
            SEELD — ביטוח, חיסכון ופנסיה. הכל שקוף, הכל מוסבר, הכל בגובה העיניים.
          </p>
        </div>
      </section>

      <main>
        {/* ══════ STORY ══════ */}
        <section className="bg-white">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
            <div className="max-w-3xl">
              <div className="border-t border-[#1a1a18]/20 pt-5 mb-10">
                <div className="text-[11px] tracking-[0.22em] font-medium mb-3" style={{ color: BRONZE }}>
                  01
                </div>
                <h2
                  className="text-[#1a1a18] leading-tight"
                  style={{ fontFamily: SERIF, fontWeight: 400, fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}
                >
                  הסיפור שלנו
                </h2>
              </div>
              <div className="space-y-4 text-[#1a1a18]/55 leading-[1.85] text-[15px] sm:text-base">
                <p>
                  SEELD היא סוכנות ביטוח, חיסכון ופנסיה. הקמנו אותה מתוך אמונה שייעוץ פיננסי טוב צריך להיות נגיש לכולם — לא רק למי שמבין את השפה המקצועית.
                </p>
                <p>
                  שמוליק מרציאנו, סוכן ביטוח פנסיוני מורשה, עובד מול כל חברות הביטוח וקרנות הפנסיה בשוק. כל לקוח מקבל בדיקה מלאה של מה שיש לו, השוואה בין האפשרויות, והמלצה כנה — בלי לחץ.
                </p>
                <p>
                  המטרה: שתבינו בדיוק מה יש לכם, למה אתם משלמים, ומה כדאי לשנות. בלי מילים מסובכות, בלי אותיות קטנות.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ══════ NUMBERS ══════ */}
        <section style={{ backgroundColor: BONE }}>
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-10 border-t border-b border-[#1a1a18]/15 py-10 sm:py-14">
              {[
                { number: "12+", label: "חברות ביטוח ובתי השקעות" },
                { number: "100%", label: "שקיפות מול הלקוח" },
                { number: "24/7", label: "פורטל אישי זמין" },
                { number: "0 ₪", label: "עלות ייעוץ ראשוני" },
              ].map((stat, i) => (
                <div key={i} className="text-center px-3">
                  <p
                    className="text-[#1a1a18] tabular-nums mb-2"
                    style={{ fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(2.2rem, 4.5vw, 3.4rem)" }}
                  >
                    {stat.number}
                  </p>
                  <p className="text-[12px] tracking-[0.12em] text-[#1a1a18]/45">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-2">
              {[
                { label: "ע.מ", value: "305275653" },
                { label: "רישיון סוכן ביטוח", value: "מורשה רשות שוק ההון 2026" },
                { label: "מבית", value: "עמיתים הון" },
              ].map((item, i) => (
                <div key={i} className="flex items-baseline justify-between py-[15px] border-b border-[#1a1a18]/10">
                  <span className="text-[13px] text-[#1a1a18]/45">{item.label}</span>
                  <span className="text-[15px] text-[#1a1a18] tabular-nums">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ MISSION ══════ */}
        <section className="bg-white">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
            <div className="max-w-3xl">
              <div className="border-t border-[#1a1a18]/20 pt-5 mb-10">
                <div className="text-[11px] tracking-[0.22em] font-medium mb-3" style={{ color: BRONZE }}>
                  02
                </div>
                <h2
                  className="text-[#1a1a18] leading-tight"
                  style={{ fontFamily: SERIF, fontWeight: 400, fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}
                >
                  המשימה שלנו
                </h2>
              </div>
              <p className="text-[#1a1a18]/55 leading-[1.85] text-[15px] sm:text-base mb-8">
                ניהול פיננסי נכון מתחיל בהבנה של מה שיש לכם. זה מה שאנחנו עושים:
              </p>
              <ul className="border-t border-[#1a1a18]/15">
                {[
                  { text: "בדיקת כל הפוליסות והמוצרים הפנסיוניים שלכם — מול כל החברות בשוק" },
                  { text: "השוואת מחירים, כיסויים ודמי ניהול — כדי שתדעו שאתם לא משלמים מיותר" },
                  { text: "מעקב שוטף: חידושים, שינויים במשפחה, עדכוני רגולציה — אנחנו בתמונה" },
                  { text: "זיהוי כפל ביטוחי, כיסויים חסרים ודמי ניהול גבוהים — וטיפול מיידי" },
                ].map((item, idx) => (
                  <li key={idx} className="flex items-baseline gap-5 py-4 border-b border-[#1a1a18]/10 text-[#1a1a18]/55 text-[15px] leading-[1.85]">
                    <span className="text-[11px] tabular-nums tracking-[0.2em] shrink-0" style={{ color: BRONZE }}>
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ══════ VALUES ══════ */}
        <section style={{ backgroundColor: BONE }}>
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
            <div className="border-t border-[#1a1a18]/20 pt-5 mb-10">
              <div className="text-[11px] tracking-[0.22em] font-medium mb-3" style={{ color: BRONZE }}>
                03
              </div>
              <h2
                className="text-[#1a1a18] leading-tight"
                style={{ fontFamily: SERIF, fontWeight: 400, fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}
              >
                הערכים שלנו
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-12 gap-y-10">
              {[
                { title: "שקיפות", description: "תראו את כל התנאים, העמלות ודמי הניהול — לפני שמחליטים. בלי הפתעות, בלי אותיות קטנות." },
                { title: "מקצועיות", description: "סוכן ביטוח פנסיוני מורשה, מעודכן ברגולציה ובשינויים בשוק. הידע הזה עובד בשבילכם." },
                { title: "אמינות", description: "האינטרס שלכם קודם. אם משהו לא מתאים — נגיד את זה ישירות." },
                { title: "נגישות", description: "ביטוח ופנסיה לא צריכים להיות מסובכים. מסבירים בשפה ברורה, עונים על כל שאלה." },
              ].map((item, idx) => (
                <div key={idx} className="border-t border-[#1a1a18]/10 pt-4">
                  <span className="text-[11px] tabular-nums tracking-[0.2em] block mb-4" style={{ color: BRONZE }}>
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-lg text-[#1a1a18] mb-2.5" style={{ fontFamily: SERIF, fontWeight: 500 }}>
                    {item.title}
                  </h3>
                  <p className="text-[13.5px] text-[#1a1a18]/50 leading-[1.8]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ CTA ══════ */}
        <section style={{ backgroundColor: PINE }}>
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <div className="border-t border-white/20 pt-5">
              <h2
                className="text-[#f6f5f1] leading-tight mb-3"
                style={{ fontFamily: SERIF, fontWeight: 400, fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}
              >
                רוצים לבדוק את המצב שלכם?
              </h2>
              <p className="text-[#f6f5f1]/45 text-[15px] leading-[1.85] mb-9 max-w-xl">
                השאירו פרטים ונחזור אליכם לשיחה ראשונית — ללא עלות וללא התחייבות.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-9 py-4 bg-[#f6f5f1] text-[#1a1a18] text-[15px] font-medium tracking-wide hover:bg-white transition-colors min-h-[52px]"
              >
                צרו קשר
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
