import Header from "@/components/Header";
import { TrendingUp, PiggyBank, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoDotsDivider } from "@/components/LogoBrandElements";

const GemelInvestment = () => {
  return (
    <div className="min-h-screen" dir="rtl">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold font-serif mb-4">קופת גמל להשקעה</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            מוצר השקעה ייחודי המשלב את היתרונות של קופת גמל עם גמישות של חשבון השקעות
          </p>
        </div>

        <LogoDotsDivider />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                נזילות גבוהה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                אפשרות למשיכת כספים בכל עת ללא קנסות או הגבלות
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-primary" />
                דחיית מס
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                דחיית תשלום מס רווחי הון עד למועד המשיכה בפועל
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                מסלולי השקעה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                מגוון מסלולי השקעה המותאמים לפרופיל הסיכון שלכם
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

export default GemelInvestment;
