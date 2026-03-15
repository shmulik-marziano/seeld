import Header from "@/components/Header";
import { Heart, Shield, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InsuranceEnrollmentForm from "@/components/InsuranceEnrollmentForm";
import DoodleDecoration from "@/components/DoodleDecoration";
import { LogoDotsDivider } from "@/components/LogoBrandElements";

const NursingClalitInsurance = () => {
  return (
    <div className="min-h-screen" dir="rtl">
      <Header />
       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
        <div className="absolute top-8 right-4 hidden lg:block">
          <DoodleDecoration type="family" size="md" className="opacity-20 rotate-6" parallax parallaxSpeed={0.1} />
        </div>
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold font-serif mb-4">ביטוח סיעודי לחברי כללית</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            כיסוי סיעודי משופר לחברי קופת חולים כללית
          </p>
        </div>

        <LogoDotsDivider />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                השלמה לכללית
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                כיסוי משלים לביטוח הבסיסי של כללית
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                תנאים מועדפים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                פרמיות מוזלות לחברי כללית
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                כיסוי מורחב
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                הרחבות נוספות מעבר לכיסוי הבסיסי
              </p>
            </CardContent>
          </Card>
        </div>

        <InsuranceEnrollmentForm 
          insuranceType="nursing" 
          title="הצטרפות לביטוח סיעודי לחברי כללית"
          description="מלאו את הפרטים וקבלו הצעה מותאמת אישית לביטוח סיעודי"
        />
      </main>
    </div>
  );
};

export default NursingClalitInsurance;
