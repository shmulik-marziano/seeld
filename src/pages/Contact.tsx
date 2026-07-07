import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";
import { useAuth } from "@/hooks/useAuth";
import {
  BODY, DISPLAY, LINE, MONO, MUTED, NAVY,
  PASTEL_BLUE, PASTEL_MINT, TURQ_TEXT,
} from "@/lib/brand";
import { LiveClock, StatusPill } from "@/components/brand/Live";

// SEELD DNA v3: white canvas, pastel circles, navy/turquoise/gold (STYLESEED.md)

// DNA v3 boxed input: white, hairline border, navy focus
const inputClass =
  "w-full px-4 py-3 bg-white border border-[#E7EDF1] rounded-lg text-[#1D2D3D] placeholder:text-[#5a6a78] text-base focus:outline-none focus:border-[#1D2D3D] transition-colors min-h-[48px]";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase.from("contact_submissions").insert([{
        user_id: user?.id || null,
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: `טלפון: ${formData.phone}\n\n${formData.message}`
      }]);

      if (error) throw error;

      try {
        await supabase.functions.invoke("send-lead-notification", {
          body: {
            type: "contact",
            leadData: {
              fullName: formData.name,
              phone: formData.phone,
              email: formData.email,
              insuranceType: formData.subject
            }
          }
        });
      } catch (emailErr) {
        console.error("Failed to send email notification:", emailErr);
      }

      toast.success("ההודעה אצלנו. נחזור אליכם באותו יום עבודה.");
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch {
      toast.error("השליחה לא עברה. נסו שוב, או חייגו 052-309-7444.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      <main>
        {/* HERO — one idea: leave details, we call back */}
        <section className="dna-page">
          {/* Pastel circle backdrop — decorative, never behind small text */}
          <div className="dna-circles" aria-hidden="true">
            <div
              className="dna-circ hidden md:block"
              style={{ width: 280, height: 280, top: -120, left: -100, backgroundColor: PASTEL_MINT, opacity: 0.5 }}
            />
            <div
              className="dna-circ hidden md:block"
              style={{ width: 220, height: 220, bottom: -120, right: -80, backgroundColor: PASTEL_BLUE, opacity: 0.55 }}
            />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-12 sm:pb-16">
            <nav className="flex items-center gap-2 text-[13px] mb-10 sm:mb-14" style={{ color: MUTED }}>
              <Link to="/" className="hover:text-[#1D2D3D] transition-colors">דף הבית</Link>
              <span aria-hidden="true">←</span>
              <span className="font-medium" style={{ color: NAVY }}>צור קשר</span>
            </nav>

            <h1
              className="dna-display leading-[1.12] mb-6 max-w-3xl"
              style={{ fontSize: "clamp(34px, 5vw, 50px)" }}
            >
              נחזור אליכם באותו יום עבודה
            </h1>
            <p className="text-base sm:text-[17px] max-w-2xl leading-[1.9]" style={{ color: MUTED }}>
              השאירו פרטים ויועץ מהצוות יחזור אליכם. שיחה אחת, בלי מרדף.
            </p>
          </div>
        </section>

        {/* FORM + DETAILS */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-14 lg:gap-24 items-start">
              {/* The one action: the form, in one calm concept card */}
              <ScrollReveal>
                <div>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new Event("seeld:open-chat"))}
                    className="mb-9 block dna-hover rounded-full"
                    aria-label="פתיחת שיחה עם יועץ SEELD"
                  >
                    <StatusPill>היועץ מחובר עכשיו · שאלו לפני שממלאים</StatusPill>
                  </button>

                  <div className="dna-concept !p-6 sm:!p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className={inputClass}
                        placeholder="שם מלא"
                      />
                      <div className="grid sm:grid-cols-2 gap-4">
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className={inputClass}
                          placeholder="אימייל"
                          dir="ltr"
                          style={{ textAlign: "right" }}
                        />
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                          className={inputClass}
                          placeholder="טלפון"
                          dir="ltr"
                          style={{ textAlign: "right" }}
                        />
                      </div>
                      <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-white border border-[#E7EDF1] rounded-lg text-[#1D2D3D] text-base focus:outline-none focus:border-[#1D2D3D] transition-colors appearance-none cursor-pointer min-h-[48px]"
                      >
                        <option value="">בחרו נושא</option>
                        <option value="pension">תכנון פנסיוני</option>
                        <option value="health-insurance">ביטוח בריאות</option>
                        <option value="life-insurance">ביטוח חיים</option>
                        <option value="car-insurance">ביטוח רכב</option>
                        <option value="home-insurance">ביטוח דירה</option>
                        <option value="savings">חיסכון והשקעות</option>
                        <option value="other">אחר</option>
                      </select>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-4 py-3 bg-white border border-[#E7EDF1] rounded-lg text-[#1D2D3D] placeholder:text-[#5a6a78] text-base focus:outline-none focus:border-[#1D2D3D] transition-colors resize-none"
                        placeholder="במה נוכל לעזור?"
                      />
                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="inline-flex items-center justify-center px-9 py-4 rounded-lg bg-[#1D2D3D] text-white text-base font-medium tracking-wide hover:bg-[#16222f] transition-colors disabled:opacity-60 min-h-[52px] min-w-[160px]"
                        >
                          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "שלחו פנייה"}
                        </button>
                        <div className="mt-5">
                          <span className="text-[12.5px]" style={{ color: MUTED }}>שתי דקות למלא. אפס אותיות קטנות.</span>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </ScrollReveal>

              {/* Side column: details rows + the clock gesture + mini FAQ */}
              <ScrollReveal delay={100}>
                <div>
                  <div className="border-t" style={{ borderColor: LINE }}>
                    <div className="py-[15px] border-b" style={{ borderColor: LINE }}>
                      <div className="flex items-baseline justify-between">
                        <span className="text-[13px]" style={{ color: MUTED }}>טלפון</span>
                        <a
                          href="tel:0523097444"
                          className="text-base tabular-nums whitespace-nowrap text-[#1D2D3D] border-b border-transparent hover:border-[#1D2D3D]/40 transition-colors"
                          dir="ltr"
                        >
                          052-309-7444
                        </a>
                      </div>
                      <p className="text-[12.5px] mt-1 text-left" style={{ color: MUTED }}>א'-ה', 9:00-18:00</p>
                    </div>
                    <div className="py-[15px] border-b" style={{ borderColor: LINE }}>
                      <div className="flex items-baseline justify-between">
                        <span className="text-[13px]" style={{ color: MUTED }}>אימייל</span>
                        <a
                          href="mailto:info@seeld.co.il"
                          className="text-base text-[#1D2D3D] border-b border-transparent hover:border-[#1D2D3D]/40 transition-colors"
                          dir="ltr"
                        >
                          info@seeld.co.il
                        </a>
                      </div>
                      <p className="text-[12.5px] mt-1 text-left" style={{ color: MUTED }}>נענה תוך יום עסקים</p>
                    </div>
                    <div className="py-[15px] border-b" style={{ borderColor: LINE }}>
                      <div className="flex items-baseline justify-between gap-6">
                        <span className="text-[13px] shrink-0" style={{ color: MUTED }}>משרדים</span>
                        <div className="text-left">
                          <p className="text-base" style={{ color: NAVY }}>המלאכה 10, רעננה</p>
                          <p className="text-base" style={{ color: NAVY }}>הסדנא 4, ירושלים</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* The clock gesture — the page keeps its LiveClock (craft bar) */}
                  <div
                    className="mt-6 rounded-xl flex items-center gap-5 p-5"
                    style={{ backgroundColor: PASTEL_MINT }}
                  >
                    <LiveClock size={52} color={NAVY} className="shrink-0" />
                    <div>
                      <span
                        className="text-[11px] font-semibold tracking-[0.2em] tabular-nums"
                        style={{ fontFamily: MONO, color: TURQ_TEXT }}
                        dir="ltr"
                      >
                        24/6 · LIVE
                      </span>
                      <p className="text-[13px] mt-1" style={{ color: BODY }}>
                        התיק שלכם מנוטר מסביב לשעון
                      </p>
                    </div>
                  </div>

                  {/* Before you write — three short answers */}
                  <div className="mt-10">
                    <h2
                      className="text-[19px] mb-5"
                      style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}
                    >
                      לפני שאתם כותבים
                    </h2>
                    <div className="border-t" style={{ borderColor: LINE }}>
                      {[
                        {
                          q: "האם הייעוץ כרוך בתשלום?",
                          a: "פגישת הייעוץ הראשונית ללא עלות וללא התחייבות.",
                        },
                        {
                          q: "כמה זמן לוקח לקבל הצעת מחיר?",
                          a: "הצעות מחיר חוזרות תוך 24-48 שעות מפגישת הייעוץ או שיחה טלפונית.",
                        },
                        {
                          q: "עם אילו חברות ביטוח אתם עובדים?",
                          a: "עם כל חברות הביטוח בישראל. משווים עבורכם את כל האפשרויות בשוק.",
                        },
                      ].map((item) => (
                        <div key={item.q} className="py-5 border-b" style={{ borderColor: LINE }}>
                          <h3 className="text-base font-medium mb-1.5" style={{ color: NAVY }}>{item.q}</h3>
                          <p className="text-[13.5px] leading-[1.85]" style={{ color: BODY }}>{item.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
