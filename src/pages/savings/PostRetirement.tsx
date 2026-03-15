import Header from "@/components/Header";
import { Umbrella, Banknote, HeartHandshake, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoDotsDivider } from "@/components/LogoBrandElements";

const PostRetirement = () => {
  return (
    <div className="min-h-screen" dir="rtl">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Umbrella className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold font-serif mb-4">אחרי פרישה</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            ניהול חכם של הפנסיה והחסכונות לאחר הפרישה מעבודה
          </p>
        </div>

        <LogoDotsDivider />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-primary" />
                ניהול קצבה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                אופטימיזציה של הקצבה החודשית ותכנון תקציב
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-primary" />
                זכויות פנסיונרים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                מיצוי זכויות והטבות המגיעות לפנסיונרים
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Umbrella className="w-5 h-5 text-primary" />
                הגנה על הון
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                שמירה על ערך החסכונות והשקעה בטוחה
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

export default PostRetirement;
