import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FundReturnTable from "@/components/FundReturnTable";
import { TrendingUp, Calendar, Info, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  studyFundsGeneral,
  studyFundsStocks,
  pensionFundsGeneral,
  pensionPlansGeneral,
  savingsPolicies,
  lastUpdateDate,
} from "@/data/fundReturns";

const ReturnTables = () => {
  return (
    <div className="min-h-screen bg-background animate-fade-in" dir="rtl">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="mb-12 text-center space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight animate-slide-down">
            לוחות תשואה
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-slide-up stagger-1">
            נתוני תשואות עדכניים של קרנות השתלמות, קופות גמל וקרנות פנסיה בישראל
          </p>
          <div className="flex items-center justify-center gap-4 animate-slide-up stagger-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              עדכון אחרון: {lastUpdateDate}
            </div>
          </div>
        </div>

        {/* Tabs for different fund types */}
        <Tabs defaultValue="study-general" className="space-y-8">
          <TabsList className="w-full flex flex-wrap h-auto gap-2 bg-muted p-2 rounded-2xl">
            <TabsTrigger value="study-general" className="flex-1 min-w-[120px] rounded-xl">
              השתלמות כללי
            </TabsTrigger>
            <TabsTrigger value="study-stocks" className="flex-1 min-w-[120px] rounded-xl">
              השתלמות מניות
            </TabsTrigger>
            <TabsTrigger value="gemel" className="flex-1 min-w-[120px] rounded-xl">
              קופות גמל
            </TabsTrigger>
            <TabsTrigger value="pension" className="flex-1 min-w-[120px] rounded-xl">
              קרנות פנסיה
            </TabsTrigger>
            <TabsTrigger value="savings" className="flex-1 min-w-[120px] rounded-xl">
              פוליסות חיסכון
            </TabsTrigger>
          </TabsList>

          <TabsContent value="study-general" className="animate-fade-in">
            <FundReturnTable 
              funds={studyFundsGeneral} 
              title="קרנות השתלמות - מסלול כללי" 
            />
          </TabsContent>

          <TabsContent value="study-stocks" className="animate-fade-in">
            <FundReturnTable 
              funds={studyFundsStocks} 
              title="קרנות השתלמות - מסלול מניות" 
            />
          </TabsContent>

          <TabsContent value="gemel" className="animate-fade-in">
            <FundReturnTable 
              funds={pensionFundsGeneral} 
              title="קופות גמל - מסלול כללי" 
            />
          </TabsContent>

          <TabsContent value="pension" className="animate-fade-in">
            <FundReturnTable 
              funds={pensionPlansGeneral} 
              title="קרנות פנסיה - מסלול כללי" 
            />
          </TabsContent>

          <TabsContent value="savings" className="animate-fade-in">
            <FundReturnTable 
              funds={savingsPolicies} 
              title="פוליסות חיסכון" 
            />
          </TabsContent>
        </Tabs>

        {/* Summary Stats */}
        <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/20 p-6 text-center">
            <TrendingUp className="w-10 h-10 mx-auto mb-3 text-green-600" />
            <p className="text-3xl font-bold text-green-600">17.21%</p>
            <p className="text-sm text-muted-foreground">תשואה שנתית מקסימלית</p>
            <p className="text-xs text-muted-foreground mt-1">אלטשולר שחם השתלמות</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 p-6 text-center">
            <Calendar className="w-10 h-10 mx-auto mb-3 text-blue-600" />
            <p className="text-3xl font-bold text-blue-600">52.34%</p>
            <p className="text-sm text-muted-foreground">תשואה ל-5 שנים מקסימלית</p>
            <p className="text-xs text-muted-foreground mt-1">אלטשולר שחם השתלמות</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/20 p-6 text-center">
            <Info className="w-10 h-10 mx-auto mb-3 text-purple-600" />
            <p className="text-3xl font-bold text-purple-600">26</p>
            <p className="text-sm text-muted-foreground">קרנות במעקב</p>
            <p className="text-xs text-muted-foreground mt-1">5 קטגוריות שונות</p>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="mt-12 rounded-[2.5rem] bg-muted p-8 md:p-12">
          <h2 className="text-2xl font-bold mb-4">הבהרה חשובה</h2>
          <p className="text-muted-foreground leading-relaxed">
            הנתונים המוצגים מבוססים על מידע ממקורות ציבוריים ומיועדים להשוואה כללית בלבד. 
            תשואות עבר אינן מעידות על תשואות עתידיות. דמי הניהול אינם כלולים בחישוב התשואות.
            לפני קבלת החלטות פיננסיות, מומלץ להתייעץ עם יועץ פנסיוני או פיננסי מוסמך.
            <br /><br />
            <strong>מקור הנתונים:</strong> משרד האוצר, אתרי חברות הביטוח והגופים המוסדיים.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ReturnTables;
