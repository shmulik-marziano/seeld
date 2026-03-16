import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import { articles } from "@/data/articles";
import { Link } from "react-router-dom";

const Growth = () => {
  const savingsArticles = articles.filter(article => 
    article.category.includes("חיסכון") || 
    article.category.includes("השקעות") ||
    article.category.includes("תקציב")
  );

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-16 text-center space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight animate-slide-down">
            חיסכון ופיננסים
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-slide-up stagger-1">
            בנו את העתיד הפיננסי שלכם. 
            מדריכים מקצועיים בנושאי חיסכון, פנסיה, קרנות השתלמות והשקעות — הכל במקום אחד.
          </p>
        </div>

        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savingsArticles.map((article, index) => (
              <div key={article.id} className={`animate-slide-up stagger-${Math.min(index + 2, 6)}`}>
                <ArticleCard {...article} />
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-2xl bg-card p-8 md:p-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">תכנון פיננסי נכון</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                תכנון פיננסי נכון הוא הבסיס לביטחון כלכלי. בין אם אתם רק מתחילים את הקריירה, 
                מתכננים רכישת דירה או מתקרבים לגיל הפרישה — ייעוץ מקצועי יכול לעשות את ההבדל.
              </p>
              <p>
                צוות המומחים של SEELD כאן כדי לעזור לכם לבנות תוכנית פיננסית מותאמת אישית, 
                לנצל את כל הטבות המס הזמינות ולבחור את אפיקי החיסכון וההשקעה המתאימים לכם.
              </p>
            </div>
            <div className="mt-8">
              <Link to="/contact" className="inline-block px-8 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
                לייעוץ פיננסי
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Growth;
