import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";
import { useAuth } from "@/hooks/useAuth";
import { BONE, BRONZE, SERIF } from "@/lib/brand";
import { StatusPill } from "@/components/brand/Live";

const inputClass =
  "w-full px-0 py-3.5 bg-transparent border-b border-[#171717]/20 text-[#171717] placeholder:text-[#6e6e6e] text-base focus:outline-none focus:border-[#171717] transition-colors min-h-[44px] rounded-none";

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
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: BONE }}>
      <Header />

      {/* HERO — one idea: leave details, we call back */}
      <section style={{ backgroundColor: BONE }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-12 sm:pb-16">
          <div className="border-t border-[#171717]/20 pt-5 mb-10 sm:mb-14 flex items-baseline justify-between gap-4">
            <nav className="flex items-center gap-2 text-[12px] text-[#6e6e6e]">
              <Link to="/" className="hover:text-[#171717] transition-colors">דף הבית</Link>
              <span>←</span>
              <span className="text-[#171717]/70 font-medium">צור קשר</span>
            </nav>
            <span className="hidden sm:inline text-[11px] tracking-[0.22em] font-medium" style={{ color: BRONZE }}>
              צור קשר
            </span>
          </div>

          <h1
            className="text-[#171717] leading-[1.15] mb-6 max-w-3xl"
            style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(2rem, 5vw, 3.4rem)" }}
          >
            נחזור אליכם באותו יום עבודה
          </h1>
          <p className="text-base sm:text-[17px] text-[#5c5c5c] max-w-2xl leading-[1.9]">
            השאירו פרטים ויועץ מהצוות יחזור אליכם. שיחה אחת, בלי מרדף.
          </p>
        </div>
      </section>

      <main className="bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-14 lg:gap-24">
            {/* Contact Form — the one action on this page */}
            <ScrollReveal>
              <div>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event("seeld:open-chat"))}
                  className="mb-10 block transition-transform hover:-translate-y-[1px]"
                  aria-label="פתיחת שיחה עם יועץ SEELD"
                >
                  <StatusPill>היועץ מחובר עכשיו · שאלו לפני שממלאים</StatusPill>
                </button>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
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
                  </div>
                  <div className="grid sm:grid-cols-2 gap-x-10 gap-y-6">
                    <div>
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
                    </div>
                    <div>
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
                  </div>
                  <div>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-0 py-3.5 bg-transparent border-b border-[#171717]/20 text-[#171717] text-base focus:outline-none focus:border-[#171717] transition-colors appearance-none cursor-pointer min-h-[44px] rounded-none"
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
                  </div>
                  <div>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-0 py-3.5 bg-transparent border-b border-[#171717]/20 text-[#171717] placeholder:text-[#6e6e6e] text-base focus:outline-none focus:border-[#171717] transition-colors resize-none rounded-none"
                      placeholder="במה נוכל לעזור?"
                    />
                  </div>
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center justify-center px-9 py-4 bg-[#171717] text-[#fafafa] text-base font-medium tracking-wide hover:bg-[#33332f] transition-colors disabled:opacity-60 min-h-[52px] min-w-[160px]"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "שלחו פנייה"}
                    </button>
                    <div className="mt-5">
                      <span className="text-[12px] text-[#6e6e6e]">שתי דקות למלא. אפס אותיות קטנות.</span>
                    </div>
                  </div>
                </form>
              </div>
            </ScrollReveal>

            {/* Contact details — reference, not competing actions */}
            <ScrollReveal delay={100}>
              <div>
                <div className="border-t border-[#171717]/15">
                  <div className="py-[15px] border-b border-[#171717]/10">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[13px] text-[#6e6e6e]">טלפון</span>
                      <a
                        href="tel:0523097444"
                        className="text-base text-[#171717] tabular-nums border-b border-transparent hover:border-[#171717]/40 transition-colors"
                        dir="ltr"
                      >
                        052-309-7444
                      </a>
                    </div>
                    <p className="text-[12px] text-[#6e6e6e] mt-1 text-left">א'-ה', 9:00-18:00</p>
                  </div>
                  <div className="py-[15px] border-b border-[#171717]/10">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[13px] text-[#6e6e6e]">אימייל</span>
                      <a
                        href="mailto:info@seeld-ins.co.il"
                        className="text-base text-[#171717] border-b border-transparent hover:border-[#171717]/40 transition-colors"
                        dir="ltr"
                      >
                        info@seeld-ins.co.il
                      </a>
                    </div>
                    <p className="text-[12px] text-[#6e6e6e] mt-1 text-left">נענה תוך יום עסקים</p>
                  </div>
                  <div className="py-[15px] border-b border-[#171717]/10">
                    <div className="flex items-baseline justify-between gap-6">
                      <span className="text-[13px] text-[#6e6e6e] shrink-0">משרדים</span>
                      <div className="text-left">
                        <p className="text-base text-[#171717]">המלאכה 10, רעננה</p>
                        <p className="text-base text-[#171717]">הסדנא 4, ירושלים</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-14">
                  <div className="border-t border-[#171717]/20 pt-5 mb-6">
                    <h2
                      className="text-[#171717] leading-tight"
                      style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "1.2rem" }}
                    >
                      לפני שאתם כותבים
                    </h2>
                  </div>
                  <div>
                    <div className="border-b border-[#171717]/10 pb-5 mb-5">
                      <h3 className="text-base font-medium text-[#171717] mb-1.5">האם הייעוץ כרוך בתשלום?</h3>
                      <p className="text-[13px] text-[#5c5c5c] leading-[1.85]">
                        פגישת הייעוץ הראשונית ללא עלות וללא התחייבות.
                      </p>
                    </div>
                    <div className="border-b border-[#171717]/10 pb-5 mb-5">
                      <h3 className="text-base font-medium text-[#171717] mb-1.5">כמה זמן לוקח לקבל הצעת מחיר?</h3>
                      <p className="text-[13px] text-[#5c5c5c] leading-[1.85]">
                        הצעות מחיר חוזרות תוך 24-48 שעות מפגישת הייעוץ או שיחה טלפונית.
                      </p>
                    </div>
                    <div className="border-b border-[#171717]/10 pb-5">
                      <h3 className="text-base font-medium text-[#171717] mb-1.5">עם אילו חברות ביטוח אתם עובדים?</h3>
                      <p className="text-[13px] text-[#5c5c5c] leading-[1.85]">
                        עם כל חברות הביטוח בישראל. משווים עבורכם את כל האפשרויות בשוק.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
