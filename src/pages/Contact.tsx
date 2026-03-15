import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Mail, MapPin, Phone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";
import { useAuth } from "@/hooks/useAuth";
import ScrollReveal from "@/components/ScrollReveal";
import DoodleDecoration from "@/components/DoodleDecoration";
import { LogoDotsDivider } from "@/components/LogoBrandElements";

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
    <div className="min-h-screen bg-background animate-fade-in">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="mb-16 text-center space-y-6 relative">
          <div className="absolute top-0 left-8 hidden lg:block">
            <DoodleDecoration type="handshake" size="lg" className="opacity-25 rotate-6" />
          </div>
          <div className="absolute top-0 right-8 hidden lg:block">
            <DoodleDecoration type="family" size="md" className="opacity-20 -rotate-6" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight animate-slide-down">
            צרו קשר
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-slide-up stagger-1">
            רוצים לקבל הצעת מחיר? יש לכם שאלה בנושא ביטוח או חיסכון? נשמח לעזור.
          </p>
        </div>

        <LogoDotsDivider />

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <ScrollReveal direction="right">
            <div className="rounded-2xl bg-card p-8">
              <h2 className="text-2xl font-bold mb-6">השאירו פרטים</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    שם מלא
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring text-right"
                    placeholder="השם שלכם" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      אימייל
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring text-right"
                      placeholder="email@example.com"
                      dir="ltr" />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium mb-2">
                      טלפון
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring text-right"
                      placeholder="050-1234567"
                      dir="ltr" />
                  </div>
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium mb-2">
                    נושא הפנייה
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring text-right">
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
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    הודעה (אופציונלי)
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none text-right"
                    placeholder="ספרו לנו במה נוכל לעזור..." />
                </div>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full py-6">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "שלחו פנייה"}
                </Button>
              </form>
            </div>
          </ScrollReveal>

          {/* Contact Information */}
          <div className="space-y-8">
            <ScrollReveal direction="left">
              <div className="rounded-2xl bg-card p-8">
                <h2 className="text-2xl font-bold mb-6">דרכי התקשרות</h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">טלפון</h3>
                      <a href="tel:0523097444" className="text-muted-foreground hover:text-accent transition-colors" dir="ltr">052-309-7444</a>
                      <p className="text-muted-foreground text-sm">א׳-ה׳, 9:00-18:00</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">אימייל</h3>
                      <a href="mailto:info@seeld-ins.co.il" className="text-muted-foreground hover:text-accent transition-colors" dir="ltr">info@seeld-ins.co.il</a>
                      <p className="text-muted-foreground text-sm">נענה תוך יום עסקים</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">משרדים</h3>
                      <p className="text-muted-foreground">המלאכה 10, רעננה</p>
                      <p className="text-muted-foreground">הסדנא 4, ירושלים</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="left" delay={150}>
              <div className="rounded-2xl bg-muted p-8 relative overflow-hidden">
                <div className="absolute bottom-2 left-2 hidden md:block">
                  <DoodleDecoration type="shield" size="sm" className="opacity-15" />
                </div>
                <h3 className="text-xl font-bold mb-4">שאלות נפוצות</h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-1">האם הייעוץ כרוך בתשלום?</h4>
                    <p className="text-muted-foreground">
                      פגישת הייעוץ הראשונית ללא עלות וללא התחייבות. נשמח להכיר אתכם ולהבין את הצרכים שלכם.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">כמה זמן לוקח לקבל הצעת מחיר?</h4>
                    <p className="text-muted-foreground">
                      אנחנו מחזירים הצעות מחיר תוך 24-48 שעות לאחר פגישת הייעוץ או שיחה טלפונית.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">עם אילו חברות ביטוח אתם עובדים?</h4>
                    <p className="text-muted-foreground">
                      אנחנו עובדים עם כל חברות הביטוח בישראל ומשווים עבורכם את כל האפשרויות בשוק.
                    </p>
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
