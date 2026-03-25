import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Loader2 } from "lucide-react";
import PersonalAreaLogin from "@/components/personal-area/PersonalAreaLogin";
import PersonalAreaDashboard from "@/components/personal-area/PersonalAreaDashboard";
import { motion } from "framer-motion";

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

  // Not logged in — full-screen login with its own branding
  if (!user) {
    return <PersonalAreaLogin />;
  }

  // Logged in — dashboard with site chrome
  return (
    <div className="min-h-screen bg-[#f8f9fc]" dir="rtl">
      <Header />

      {/* Hero section with bubble accents */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(165deg, #072e2e 0%, #0a3d3d 40%, #0d4a4a 100%)" }}>
        {/* Soft bubble decorations */}
        <motion.div
          animate={{ y: [0, -10, 0], scale: [1, 1.03, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-15%] right-[5%] w-[200px] h-[200px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, #5ec6c6, transparent 70%)" }}
        />
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute bottom-[-10%] left-[10%] w-[150px] h-[150px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, #f4a261, transparent 70%)" }}
        />

        {/* Small floating dots */}
        <div className="absolute top-6 left-[25%] w-2.5 h-2.5 rounded-full bg-[#5ec6c6] opacity-20 hidden sm:block" />
        <div className="absolute bottom-8 right-[35%] w-2 h-2 rounded-full bg-[#f4a261] opacity-25 hidden sm:block" />
        <div className="absolute top-[50%] left-[8%] w-3 h-3 rounded-full bg-[#90be6d] opacity-15 hidden sm:block" />

        {/* Dashed curves */}
        <svg className="absolute bottom-0 left-0 w-full h-10 opacity-[0.06] pointer-events-none" viewBox="0 0 800 30" fill="none">
          <path d="M0 20 Q200 5 400 18 T800 8" stroke="#5ec6c6" strokeWidth="1" strokeDasharray="8 6" />
        </svg>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:pb-32 sm:pt-16 relative z-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
            האזור האישי
          </h1>
          <p className="text-white/50 text-base sm:text-lg">
            צפו בפוליסות, מסמכים, המלצות ומידע מותאם אישית
          </p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-8 sm:pb-10 -mt-8 sm:-mt-24 relative z-20">
        <PersonalAreaDashboard />
      </main>
      <Footer />
    </div>
  );
};

export default PersonalArea;
