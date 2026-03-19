import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Loader2 } from "lucide-react";
import PersonalAreaLogin from "@/components/personal-area/PersonalAreaLogin";
import PersonalAreaDashboard from "@/components/personal-area/PersonalAreaDashboard";

const PersonalArea = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fc]">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#0a3d3d]" />
        </div>
      </div>
    );
  }

  // If not logged in, show full-screen login (no header/footer — login has its own branding)
  if (!user) {
    return <PersonalAreaLogin />;
  }

  // Logged in — show dashboard with site chrome
  return (
    <div className="min-h-screen bg-[#f8f9fc]" dir="rtl">
      <Header />

      {/* Hero section */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(165deg, #0a3d3d 0%, #0d4a4a 50%, #125555 100%)' }}>
        {/* Decorative elements */}
        <div className="absolute top-[-20%] right-[-5%] w-[300px] h-[300px] rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #5ec6c6 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-15%] left-[-3%] w-[200px] h-[200px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #f4a261 0%, transparent 70%)' }} />

        {/* Dashed line */}
        <svg className="absolute bottom-0 left-0 w-full h-12 opacity-[0.08] pointer-events-none" viewBox="0 0 800 40" fill="none">
          <path d="M0 30 Q200 5 400 25 T800 12" stroke="#5ec6c6" strokeWidth="1.5" strokeDasharray="8 6" />
        </svg>

        {/* Colored dots */}
        <div className="absolute top-8 left-[20%] w-2.5 h-2.5 rounded-full bg-[#f4a261] opacity-40 hidden sm:block" />
        <div className="absolute bottom-10 right-[30%] w-3 h-3 rounded-full bg-[#5ec6c6] opacity-30 hidden sm:block" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 relative z-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
            האזור האישי
          </h1>
          <p className="text-white/60 text-lg">
            צפו בפוליסות, מסמכים והמלצות מותאמות אישית
          </p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <PersonalAreaDashboard />
      </main>
      <Footer />
    </div>
  );
};

export default PersonalArea;
