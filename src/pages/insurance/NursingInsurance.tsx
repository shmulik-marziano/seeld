import Header from "@/components/Header";
import { Heart, Shield, Users } from "lucide-react";
import FeatureCard from "@/components/FeatureCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InsuranceEnrollmentForm from "@/components/InsuranceEnrollmentForm";
import DoodleDecoration from "@/components/DoodleDecoration";
import { LogoDotsDivider } from "@/components/LogoBrandElements";

const NursingInsurance = () => {
  return (
    <div className="min-h-screen" dir="rtl">
      <Header />
       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
        <div className="absolute top-8 left-8 hidden lg:block">
          <DoodleDecoration type="shield" size="lg" className="opacity-20 -rotate-12" parallax parallaxSpeed={0.15} />
        </div>
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold font-serif mb-4">ביטוח סיעודי</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            הגנה כלכלית במקרה של הפיכה לסיעודי - לכם ולמשפחתכם
          </p>
        </div>

        <LogoDotsDivider />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                פיצוי חודשי
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                תשלום חודשי למימון טיפול סיעודי איכותי
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                טיפול בבית
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                מימון מטפל סיעודי בבית או במוסד
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                הגנה על המשפחה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                מניעת נטל כלכלי על בני המשפחה
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Feature Cards */}
        <section className="py-8 mb-12">
          <div className="grid sm:grid-cols-2 gap-6">
            <FeatureCard title="הגנה כלכלית" description="פיצוי חודשי שמכסה את עלויות הטיפול הסיעודי" bgColor="bg-blue-50/80 dark:bg-blue-950/20" doodle="shield" />
            <FeatureCard title="גמישות בטיפול" description="בחירה בין טיפול בבית, מוסד או שילוב של שניהם" bgColor="bg-green-50/80 dark:bg-green-950/20" doodle="family" />
            <FeatureCard title="ללא בדיקות רפואיות" description="הצטרפות פשוטה ללא תהליך חיתום מורכב" bgColor="bg-amber-50/80 dark:bg-amber-950/20" doodle="lightbulb" />
            <FeatureCard title="שקט נפשי" description="ביטחון שהמשפחה לא תישא בנטל הכלכלי" bgColor="bg-purple-50/80 dark:bg-purple-950/20" doodle="umbrella" />
          </div>
        </section>

        <InsuranceEnrollmentForm 
          insuranceType="nursing" 
          title="הצטרפות לביטוח סיעודי"
          description="מלאו את הפרטים וקבלו הצעה מותאמת אישית לביטוח סיעודי"
        />
      </main>
    </div>
  );
};

export default NursingInsurance;
