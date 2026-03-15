import Header from "@/components/Header";
import { Briefcase, Shield, Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InsuranceContactForm from "@/components/InsuranceContactForm";
import DoodleDecoration from "@/components/DoodleDecoration";
import { LogoDotsDivider } from "@/components/LogoBrandElements";

const DisabilityInsurance = () => {
  return (
    <div className="min-h-screen" dir="rtl">
      <Header />
       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
        <div className="absolute top-8 left-8 hidden lg:block">
          <DoodleDecoration type="shield" size="lg" className="opacity-20 rotate-6" parallax parallaxSpeed={0.15} />
        </div>
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Briefcase className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold font-serif mb-4">ביטוח אובדן כושר עבודה</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            הגנה על ההכנסה שלכם במקרה של אובדן יכולת לעבוד
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
                תשלום חודשי קבוע במקרה של אי יכולת לעבוד
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                הגדרה עיסוקית
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                כיסוי מותאם למקצוע הספציפי שלכם
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                שחרור מפרמיות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                פטור מתשלום פרמיות בתקופת אי כושר
              </p>
            </CardContent>
          </Card>
        </div>

        <InsuranceContactForm insuranceType="ביטוח אובדן כושר עבודה" />
      </main>
    </div>
  );
};

export default DisabilityInsurance;
