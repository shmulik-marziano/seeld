import Header from "@/components/Header";
import { Clock, Calculator, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoDotsDivider } from "@/components/LogoBrandElements";

const PreRetirement = () => {
  return (
    <div className="min-h-screen" dir="rtl">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Clock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold font-serif mb-4">לפני פרישה</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            הכנה מקיפה לפרישה - כל מה שצריך לדעת לפני המעבר לפנסיה
          </p>
        </div>

        <LogoDotsDivider />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                תחשיב פנסיה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                חישוב מדויק של הקצבה הצפויה והיערכות כלכלית
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                איחוד חסכונות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                ריכוז כל החסכונות הפנסיוניים למקסום הזכויות
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                תכנון מס
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                אופטימיזציה של תשלומי המס בפרישה
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

export default PreRetirement;
