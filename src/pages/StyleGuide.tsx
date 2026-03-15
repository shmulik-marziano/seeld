import Header from "@/components/Header";
import { Button } from "@/components/ui/button";

const StyleGuide = () => {
  return (
    <div className="min-h-screen bg-background animate-fade-in" dir="rtl">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="mb-16 text-center space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight animate-slide-down">
            מדריך עיצוב
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed animate-slide-up stagger-1">
            הצגה של מערכת העיצוב, טיפוגרפיה ודפוסי רכיבים של SeelD.
          </p>
        </div>

        {/* Typography */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">טיפוגרפיה</h2>
          <div className="space-y-6">
            <div>
              <h1 className="text-5xl font-bold mb-2">כותרת 1</h1>
              <p className="text-sm text-muted-foreground">גופן: Heebo Bold, 3rem</p>
            </div>
            <div>
              <h2 className="text-4xl font-bold mb-2">כותרת 2</h2>
              <p className="text-sm text-muted-foreground">גופן: Heebo Bold, 2.25rem</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold mb-2">כותרת 3</h3>
              <p className="text-sm text-muted-foreground">גופן: Heebo Bold, 1.875rem</p>
            </div>
            <div>
              <h4 className="text-2xl font-bold mb-2">כותרת 4</h4>
              <p className="text-sm text-muted-foreground">גופן: Heebo Bold, 1.5rem</p>
            </div>
            <div>
              <p className="text-lg mb-2">גוף טקסט גדול - זהו טקסט פסקה בגודל גדול יותר להדגשה או תוכן מבוא.</p>
              <p className="text-sm text-muted-foreground">גופן: Heebo Regular, 1.125rem</p>
            </div>
            <div>
              <p className="mb-2">גוף טקסט רגיל - זהו טקסט פסקה סטנדרטי המשמש באתר לקריאה נוחה.</p>
              <p className="text-sm text-muted-foreground">גופן: Heebo Regular, 1rem</p>
            </div>
            <div>
              <p className="text-sm mb-2">גוף טקסט קטן - משמש לכיתובים, מטא-דאטה ומידע משלים.</p>
              <p className="text-sm text-muted-foreground">גופן: Heebo Regular, 0.875rem</p>
            </div>
          </div>
        </section>

        {/* Colors */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">פלטת צבעים</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-24 rounded-lg bg-background border border-border"></div>
              <p className="text-sm font-medium">רקע</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 rounded-lg bg-foreground"></div>
              <p className="text-sm font-medium">טקסט</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 rounded-lg bg-primary"></div>
              <p className="text-sm font-medium">ראשי</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 rounded-lg bg-secondary"></div>
              <p className="text-sm font-medium">משני</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 rounded-lg bg-accent"></div>
              <p className="text-sm font-medium">הדגשה</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 rounded-lg bg-muted"></div>
              <p className="text-sm font-medium">מעומעם</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 rounded-lg bg-card border border-border"></div>
              <p className="text-sm font-medium">כרטיס</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 rounded-lg bg-destructive"></div>
              <p className="text-sm font-medium">אזהרה</p>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">כפתורים</h2>
          <div className="flex flex-wrap gap-4">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full">
              כפתור ראשי
            </Button>
            <Button variant="secondary" className="rounded-full">
              כפתור משני
            </Button>
            <Button variant="outline" className="rounded-full">
              כפתור מסגרת
            </Button>
            <Button variant="ghost">
              כפתור רפאים
            </Button>
            <Button variant="destructive" className="rounded-full">
              כפתור אזהרה
            </Button>
          </div>
        </section>

        {/* Category Tags */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">תגיות קטגוריה</h2>
          <div className="flex flex-wrap gap-3">
            <span className="px-4 py-2 rounded-full text-sm font-medium tag-wellness">בריאות</span>
            <span className="px-4 py-2 rounded-full text-sm font-medium tag-travel">נסיעות</span>
            <span className="px-4 py-2 rounded-full text-sm font-medium tag-creativity">ביטוח</span>
            <span className="px-4 py-2 rounded-full text-sm font-medium tag-growth">צמיחה</span>
            <span className="px-4 py-2 rounded-full text-sm font-medium tag-lifestyle">אורח חיים</span>
            <span className="px-4 py-2 rounded-full text-sm font-medium tag-community">קהילה</span>
            <span className="px-4 py-2 rounded-full text-sm font-medium tag-financing">פיננסים</span>
          </div>
        </section>

        {/* Cards */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">כרטיסים</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-card p-6 border border-border">
              <h3 className="text-xl font-bold mb-3">כותרת כרטיס</h3>
              <p className="text-muted-foreground">
                זהו רכיב כרטיס סטנדרטי המשמש באתר להכלת תוכן ומידע קשורים.
              </p>
            </div>
            <div className="rounded-2xl bg-muted p-6">
              <h3 className="text-xl font-bold mb-3">כרטיס מעומעם</h3>
              <p className="text-muted-foreground">
                גרסה עם רקע מעומעם להדגשה עדינה או קטעי תוכן משניים.
              </p>
            </div>
          </div>
        </section>

        {/* Spacing */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">סולם ריווח</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-4 bg-primary rounded"></div>
              <span className="text-sm">1rem (16px) - ריווח קטן</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-24 h-4 bg-primary rounded"></div>
              <span className="text-sm">1.5rem (24px) - ריווח בינוני</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 h-4 bg-primary rounded"></div>
              <span className="text-sm">2rem (32px) - ריווח גדול</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-48 h-4 bg-primary rounded"></div>
              <span className="text-sm">3rem (48px) - ריווח גדול במיוחד</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default StyleGuide;
