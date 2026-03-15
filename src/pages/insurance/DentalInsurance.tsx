import Header from "@/components/Header";
import { Smile, Shield, Star } from "lucide-react";
import FeatureCard from "@/components/FeatureCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InsuranceEnrollmentForm from "@/components/InsuranceEnrollmentForm";
import DoodleDecoration from "@/components/DoodleDecoration";
import { LogoDotsDivider } from "@/components/LogoBrandElements";

const DentalInsurance = () => {
  return (
    <div className="min-h-screen" dir="rtl">
      <Header />
       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
        <div className="absolute top-12 right-4 hidden lg:block">
          <DoodleDecoration type="family" size="md" className="opacity-20 rotate-12" parallax parallaxSpeed={0.1} />
        </div>
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Smile className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold font-serif mb-4">ביטוח שיניים</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            כיסוי מקיף לטיפולי שיניים - משמרים, שיקומיים וקוסמטיים
          </p>
        </div>

        <LogoDotsDivider />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                טיפולים משמרים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                סתימות, ניקוי אבנית וטיפולי שורש
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smile className="w-5 h-5 text-primary" />
                שיקום הפה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                כתרים, גשרים ושתלים דנטליים
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                יישור שיניים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                טיפולי אורתודונטיה לילדים ומבוגרים
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Feature Cards */}
        <section className="py-8 mb-12">
          <div className="grid sm:grid-cols-2 gap-6">
            <FeatureCard title="רופאים מומחים" description="רשת רופאי שיניים מובילים בכל רחבי הארץ" bgColor="bg-blue-50/80 dark:bg-blue-950/20" doodle="handshake" />
            <FeatureCard title="חיסכון משמעותי" description="עד 70% הנחה על טיפולי שיניים יקרים כמו שתלים וכתרים" bgColor="bg-green-50/80 dark:bg-green-950/20" doodle="savings" />
            <FeatureCard title="ללא תקופת המתנה" description="כיסוי מיידי לטיפולים משמרים ללא המתנה" bgColor="bg-amber-50/80 dark:bg-amber-950/20" doodle="shield" />
            <FeatureCard title="כיסוי לכל המשפחה" description="תוכניות מותאמות לילדים, מבוגרים ומשפחות שלמות" bgColor="bg-purple-50/80 dark:bg-purple-950/20" doodle="family" />
          </div>
        </section>

        <InsuranceEnrollmentForm 
          insuranceType="dental" 
          title="הצטרפות לביטוח שיניים"
          description="מלאו את הפרטים וקבלו הצעה מותאמת אישית לביטוח שיניים"
        />
      </main>
    </div>
  );
};

export default DentalInsurance;
