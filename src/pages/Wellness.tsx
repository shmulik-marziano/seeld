import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import { articles } from "@/data/articles";
import { Link } from "react-router-dom";

const Wellness = () => {
  const healthInsuranceArticles = articles.filter(article => 
    article.category.includes("ביטוח בריאות") || 
    article.category.includes("ביטוח חיים")
  );

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-16 text-center space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight animate-slide-down">
            שירותים ופעולות
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-slide-up stagger-1">
            גלו את מגוון השירותים הפיננסיים והביטוחיים שלנו. 
            מביטוח בריאות ועד ביטוח חיים — כאן תמצאו את כל המידע והכלים לניהול נכון של הביטחון הפיננסי שלכם.
          </p>
        </div>

        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {healthInsuranceArticles.map((article, index) => (
              <div key={article.id} className={`animate-slide-up stagger-${Math.min(index + 2, 6)}`}>
                <ArticleCard {...article} />
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-2xl bg-card p-8 md:p-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">השירותים שלנו</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                ב-SEELD אנחנו מציעים מגוון רחב של שירותים פיננסיים וביטוחיים, 
                כולם מותאמים אישית לצרכים הייחודיים שלכם. הצוות המקצועי שלנו כאן 
                כדי ללוות אתכם בכל שלב — מהייעוץ הראשוני ועד הטיפול בתביעות.
              </p>
              <p>
                בין אם אתם מחפשים ביטוח בריאות פרטי, ביטוח חיים, ביטוח רכב או דירה — 
                אנחנו נמצא עבורכם את הפוליסה המתאימה ביותר במחיר הטוב ביותר.
              </p>
            </div>
            <div className="mt-8">
              <Link to="/contact" className="inline-block px-8 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
                צרו קשר
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Wellness;
