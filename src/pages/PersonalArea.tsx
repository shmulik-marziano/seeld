import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Loader2 } from "lucide-react";
import PersonalAreaLogin from "@/components/personal-area/PersonalAreaLogin";
import PersonalAreaDashboard from "@/components/personal-area/PersonalAreaDashboard";
import { LiveTag } from "@/components/brand/Live";

const HEEBO = "'Heebo', sans-serif";

const PersonalArea = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen pb-2" dir="rtl" style={{ backgroundColor: "#0a0a0a" }}>
        <Header />
        <section className="px-2 pt-2">
          <div className="bento-panel">
            <div className="flex items-center justify-center h-[60vh] relative z-10">
              <Loader2 className="w-8 h-8 animate-spin text-[#171717]" />
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Not logged in — full-screen login with its own branding
  if (!user) {
    return <PersonalAreaLogin />;
  }

  // Logged in — dashboard with site chrome
  return (
    <div className="min-h-screen pb-2" dir="rtl" style={{ backgroundColor: "#0a0a0a" }}>
      <Header />

      {/* Hero — quiet ink tile */}
      <section className="px-2 pt-2">
        <div className="bento-panel-ink">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-14 relative z-10">
            <div className="border-t border-white/20 pt-5">
              <LiveTag dark dot>PERSONAL AREA · SECURE</LiveTag>
              <h1
                className="mt-4 text-[#fafafa] leading-tight"
                style={{ fontFamily: HEEBO, fontWeight: 600, fontSize: "clamp(1.8rem, 4vw, 2.6rem)", letterSpacing: "-0.02em" }}
              >
                האזור האישי
              </h1>
              <p className="mt-2 text-[#fafafa]/50 text-base sm:text-lg">
                צפו בפוליסות, מסמכים, המלצות ומידע מותאם אישית
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard — paper tile */}
      <main className="px-2 pt-2">
        <div className="bento-panel">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 relative z-10">
            <PersonalAreaDashboard />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PersonalArea;
