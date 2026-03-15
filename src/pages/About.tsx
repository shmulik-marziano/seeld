import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ScrollReveal";
import DoodleDecoration from "@/components/DoodleDecoration";
import FeatureCard from "@/components/FeatureCard";
import { LogoDotsDivider, LogoDotsBackground } from "@/components/LogoBrandElements";

const About = () => {
  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="mb-16 text-center space-y-6 relative">
          <div className="absolute top-0 left-4 hidden md:block">
            <DoodleDecoration type="handshake" size="lg" className="opacity-25 rotate-6" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight animate-slide-down">
            אודות SeelD
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed animate-slide-up stagger-1">
            הבית שלכם לפתרונות פיננסיים וביטוחיים מותאמים אישית.
          </p>
        </div>

        {/* Story Section */}
        <ScrollReveal>
          <section className="mb-16 space-y-6 text-muted-foreground relative">
            <div className="absolute -right-16 top-8 hidden xl:block">
              <DoodleDecoration type="growth" size="md" className="opacity-20" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-6">הסיפור שלנו</h2>
            <p>
              SeelD נוסדה מתוך אמונה פשוטה: כל אדם ומשפחה ראויים לקבל ייעוץ פיננסי וביטוחי 
              מקצועי, נגיש ואמין. ראינו שוק מלא בהצעות מורכבות ואותיות קטנות, והחלטנו לעשות את זה אחרת.
            </p>
            <p>
              הצוות שלנו מורכב ממומחים מנוסים בתחומי הפיננסים, הביטוח והחיסכון, שמביאים 
              יחד עשרות שנות ניסיון. אנחנו מאמינים בשקיפות מלאה, בשירות אישי ובהתאמה מדויקת 
              לצרכים הייחודיים של כל לקוח.
            </p>
            <p>
              מאז הקמתנו, עזרנו ללקוחות רבים לתכנן את עתידם הפיננסי, לבחור ביטוחים מותאמים 
              ולחסוך כסף משמעותי. אנחנו גאים בקשרים ארוכי הטווח שבנינו עם הלקוחות שלנו.
            </p>
          </section>
        </ScrollReveal>

        <LogoDotsDivider />

        {/* Mission Section */}
        <ScrollReveal delay={100}>
          <section className="mb-16 rounded-2xl bg-card p-8 md:p-12 relative overflow-hidden">
            <div className="absolute bottom-4 left-4 hidden md:block">
              <DoodleDecoration type="family" size="sm" className="opacity-20 -rotate-6" />
            </div>
            <h2 className="text-3xl font-bold mb-6">המשימה שלנו</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                אנחנו מאמינים שניהול פיננסי נכון מתחיל בידע ובהבנה. SeelD מוקדשת 
                לספק ללקוחותינו:
              </p>
              <ul className="space-y-3 mr-6">
                <li className="flex items-start">
                  <span className="ml-3 mt-1">•</span>
                  <span>ייעוץ מקצועי ואובייקטיבי בתחומי חיסכון, פנסיה וביטוח</span>
                </li>
                <li className="flex items-start">
                  <span className="ml-3 mt-1">•</span>
                  <span>השוואה מקיפה בין כל חברות הביטוח וקרנות הפנסיה בשוק</span>
                </li>
                <li className="flex items-start">
                  <span className="ml-3 mt-1">•</span>
                  <span>ליווי אישי לאורך כל שלבי החיים הפיננסיים</span>
                </li>
                <li className="flex items-start">
                  <span className="ml-3 mt-1">•</span>
                  <span>חיסכון משמעותי בעלויות הביטוח והחיסכון שלכם</span>
                </li>
              </ul>
            </div>
          </section>
        </ScrollReveal>

        <LogoDotsDivider />

        {/* Values as Feature Cards */}
        <section className="mb-16 space-y-6 relative">
          <LogoDotsBackground />
          <ScrollReveal>
            <h2 className="text-3xl font-bold mb-8">הערכים שלנו</h2>
          </ScrollReveal>
          <ScrollReveal delay={0}>
            <FeatureCard
              title="שקיפות"
              description="אנחנו מאמינים בחשיפה מלאה של כל המידע, העמלות והתנאים — ללא הפתעות ואותיות קטנות."
              bgColor="bg-[hsl(var(--muted))]"
              doodle="lightbulb"
            />
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <FeatureCard
              title="מקצועיות"
              description="הצוות שלנו מורכב ממומחים מוסמכים עם ניסיון רב בתחום הפיננסי והביטוחי."
              bgColor="bg-primary/5"
              doodle="target"
            />
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <FeatureCard
              title="אמינות"
              description="אנחנו תמיד שמים את האינטרס של הלקוח במקום הראשון ופועלים בהתאם."
              bgColor="bg-accent/10"
              doodle="key"
            />
          </ScrollReveal>
          <ScrollReveal delay={300}>
            <FeatureCard
              title="נגישות"
              description="פיננסים וביטוח צריכים להיות מובנים לכולם. אנחנו מסבירים בשפה ברורה ופשוטה."
              bgColor="bg-[hsl(var(--muted))]"
              doodle="handshake"
            />
          </ScrollReveal>
        </section>

        {/* CTA Section */}
        <ScrollReveal direction="scale">
          <section className="text-center py-12 rounded-2xl bg-card relative overflow-hidden">
            <div className="absolute top-4 right-4 hidden md:block">
              <DoodleDecoration type="shield" size="sm" className="opacity-20 rotate-12" />
            </div>
            <h2 className="text-3xl font-bold mb-4">בואו נתחיל לתכנן יחד</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              השאירו פרטים ונחזור אליכם לשיחת ייעוץ ראשונית ללא עלות וללא התחייבות.
            </p>
            <a href="/contact">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8">
                <Mail className="ml-2 h-4 w-4" />
                צרו קשר
              </Button>
            </a>
          </section>
        </ScrollReveal>
      </main>

      <Footer />
    </div>
  );
};

export default About;
