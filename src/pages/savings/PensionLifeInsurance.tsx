import Header from "@/components/Header";
import { Heart, Shield, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoDotsDivider } from "@/components/LogoBrandElements";

const PensionLifeInsurance = () => {
  return (
    <div className="min-h-screen" dir="rtl">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold font-serif mb-4">ביטוח חיים פנסיוני</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            שילוב בין חיסכון פנסיוני לביטוח חיים המעניק הגנה מקיפה למשפחה
          </p>
        </div>

        <LogoDotsDivider />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                הגנה מלאה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                ביטוח חיים שמגן על המשפחה במקרה של אובדן מפרנס
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                חיסכון מצטבר
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                צבירת כספים לפנסיה במקביל לכיסוי ביטוחי
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                גמישות מלאה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                התאמת סכומי הביטוח והחיסכון לצרכים המשתנים
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <a href="/contact">
            <Button size="lg" className="gap-2">
              לייעוץ חינם
              <ArrowRight className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </main>
    </div>
  );
};

export default PensionLifeInsurance;
