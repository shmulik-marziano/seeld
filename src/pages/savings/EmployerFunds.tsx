import Header from "@/components/Header";
import { Building2, Users, Coins, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoDotsDivider } from "@/components/LogoBrandElements";

const EmployerFunds = () => {
  return (
    <div className="min-h-screen" dir="rtl">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold font-serif mb-4">קופות מרכזיות למעסיק</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            פתרונות פנסיוניים מותאמים לארגונים ולמעסיקים
          </p>
        </div>

        <LogoDotsDivider />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                ניהול קולקטיבי
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                ניהול מרוכז של זכויות העובדים בקופה אחת
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-primary" />
                חיסכון בעלויות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                דמי ניהול מופחתים הודות לכוח המיקוח של הארגון
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                שירות ארגוני
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                ליווי מקצועי למחלקת משאבי אנוש ולעובדים
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

export default EmployerFunds;
