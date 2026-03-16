import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Mail, MapPin, Phone, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";
import { useAuth } from "@/hooks/useAuth";

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
            type: "insurance",
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

      toast.success("ההודעה נשלחה! נחזור אליכם בהקדם.");
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (error) {
      toast.error("שגיאה בשליחת ההודעה, נסו שוב");
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

      {/* Hero Section - Bold design */}
      <section className="bg-[#f8f9fc] relative overflow-hidden">
        {/* Solid colored circles */}
        <div className="absolute top-[15%] left-[8%] w-[50px] h-[50px] sm:w-[80px] sm:h-[80px] rounded-full bg-[#5ec6c6] opacity-20 sm:opacity-100" />
        <div className="absolute bottom-[20%] right-[5%] w-[40px] h-[40px] sm:w-[60px] sm:h-[60px] rounded-full bg-[#e76f51] opacity-20 sm:opacity-100" />
        <div className="absolute top-[50%] right-[20%] w-[25px] h-[25px] sm:w-[35px] sm:h-[35px] rounded-full bg-[#f4a261] hidden sm:block" />
        <div className="absolute bottom-[30%] left-[15%] w-[20px] h-[20px] sm:w-[25px] sm:h-[25px] rounded-full bg-[#90be6d] hidden sm:block" />

        {/* Dashed curved line */}
        <div className="absolute top-8 right-[15%] hidden lg:block">
          <svg width="160" height="100" viewBox="0 0 160 100" fill="none">
            <path d="M10 80 C 40 10, 120 10, 150 50" stroke="#0a3d3d" strokeWidth="2" strokeDasharray="8 5" fill="none" opacity="0.12" />
            <polygon points="150,50 142,44 146,56" fill="#0a3d3d" opacity="0.12" />
          </svg>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-28 relative text-center">
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#0a3d3d] mb-4 leading-tight">
            צרו <span className="text-[#5ec6c6]">קשר</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            רוצים לקבל הצעת מחיר? יש לכם שאלה בנושא ביטוח או חיסכון? נשמח לעזור.
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Contact Form */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a3d3d] mb-8">השאירו פרטים</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-transparent border-0 border-b-2 border-[#0a3d3d]/20 focus:border-[#5ec6c6] outline-none py-3 text-[#0a3d3d] placeholder:text-gray-400 text-base transition-colors"
                  placeholder="שם מלא"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full bg-transparent border-0 border-b-2 border-[#0a3d3d]/20 focus:border-[#5ec6c6] outline-none py-3 text-[#0a3d3d] placeholder:text-gray-400 text-base transition-colors text-right"
                    placeholder="אימייל"
                    dir="ltr"
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
                    className="w-full bg-transparent border-0 border-b-2 border-[#0a3d3d]/20 focus:border-[#5ec6c6] outline-none py-3 text-[#0a3d3d] placeholder:text-gray-400 text-base transition-colors text-right"
                    placeholder="טלפון"
                    dir="ltr"
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
                  className="w-full bg-transparent border-0 border-b-2 border-[#0a3d3d]/20 focus:border-[#5ec6c6] outline-none py-3 text-[#0a3d3d] text-base transition-colors"
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
                  className="w-full bg-transparent border-0 border-b-2 border-[#0a3d3d]/20 focus:border-[#5ec6c6] outline-none py-3 text-[#0a3d3d] placeholder:text-gray-400 text-base transition-colors resize-none"
                  placeholder="ספרו לנו במה נוכל לעזור..."
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto bg-[#0a3d3d] text-white rounded-full px-10 py-4 font-semibold text-base hover:bg-[#0d4a4a] transition-colors shadow-lg shadow-[#0a3d3d]/20 min-h-[48px] flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "שלחו פנייה"}
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div className="bg-[#f8f9fc] rounded-2xl p-8 relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-4 left-4 w-4 h-4 rounded-full bg-[#5ec6c6] opacity-40" />
              <div className="absolute bottom-6 right-6 w-3 h-3 rounded-full bg-[#f4a261] opacity-30" />

              <h2 className="text-2xl font-extrabold text-[#0a3d3d] mb-6">דרכי התקשרות</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#5ec6c6] flex items-center justify-center flex-shrink-0 shadow-md shadow-[#5ec6c6]/20">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0a3d3d] mb-1">טלפון</h3>
                    <a href="tel:0523097444" className="text-gray-500 hover:text-[#0a3d3d] transition-colors" dir="ltr">052-309-7444</a>
                    <p className="text-gray-400 text-sm">א'-ה', 9:00-18:00</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#e76f51] flex items-center justify-center flex-shrink-0 shadow-md shadow-[#e76f51]/20">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0a3d3d] mb-1">אימייל</h3>
                    <a href="mailto:info@seeld-ins.co.il" className="text-gray-500 hover:text-[#0a3d3d] transition-colors" dir="ltr">info@seeld-ins.co.il</a>
                    <p className="text-gray-400 text-sm">נענה תוך יום עסקים</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#f4a261] flex items-center justify-center flex-shrink-0 shadow-md shadow-[#f4a261]/20">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0a3d3d] mb-1">משרדים</h3>
                    <p className="text-gray-500">המלאכה 10, רעננה</p>
                    <p className="text-gray-500">הסדנא 4, ירושלים</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#f0f0f8] rounded-2xl p-8 relative overflow-hidden">
              {/* Decorative dashed pill */}
              <div className="absolute bottom-4 left-4 hidden md:block">
                <svg width="30" height="60" viewBox="0 0 30 60" fill="none">
                  <rect x="3" y="3" width="24" height="54" rx="12" stroke="#6c63ff" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.2" />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-[#0a3d3d] mb-4">שאלות נפוצות</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-bold text-[#0a3d3d] mb-1">האם הייעוץ כרוך בתשלום?</h4>
                  <p className="text-gray-500">
                    פגישת הייעוץ הראשונית ללא עלות וללא התחייבות. נשמח להכיר אתכם ולהבין את הצרכים שלכם.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-[#0a3d3d] mb-1">כמה זמן לוקח לקבל הצעת מחיר?</h4>
                  <p className="text-gray-500">
                    אנחנו מחזירים הצעות מחיר תוך 24-48 שעות לאחר פגישת הייעוץ או שיחה טלפונית.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-[#0a3d3d] mb-1">עם אילו חברות ביטוח אתם עובדים?</h4>
                  <p className="text-gray-500">
                    אנחנו עובדים עם כל חברות הביטוח בישראל ומשווים עבורכם את כל האפשרויות בשוק.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
