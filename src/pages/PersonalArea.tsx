import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Loader2 } from "lucide-react";
import PersonalAreaLogin from "@/components/personal-area/PersonalAreaLogin";
import PersonalAreaDashboard from "@/components/personal-area/PersonalAreaDashboard";
import { IVORY, SAGE_ON_GREEN } from "@/lib/brand";

const PersonalArea = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen" dir="rtl" style={{ backgroundColor: IVORY }}>
        <Header />
        <section className="flex items-center justify-center h-[60vh]" aria-busy="true" aria-live="polite">
          <Loader2 className="w-8 h-8 animate-spin text-[#003D30]" aria-hidden="true" />
          <span className="sr-only">טוען את האזור האישי</span>
        </section>
      </div>
    );
  }

  // Not signed in: the entry screen carries its own chrome
  if (!user) {
    return <PersonalAreaLogin />;
  }

  // Signed in: site chrome, a deep-green title band, the dashboard on ivory
  return (
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: IVORY }}>
      <Header />

      <section className="dna-navy-band">
        <div className="relative max-w-brand mx-auto px-5 sm:px-8 py-10 sm:py-12">
          <h1 className="leading-tight" style={{ color: IVORY, fontSize: "clamp(28px, 3.4vw, 36px)" }}>
            האזור האישי
          </h1>
          <p className="mt-2 text-[17px] leading-[1.6] max-w-xl" style={{ color: SAGE_ON_GREEN }}>
            הפוליסות, החיסכון, המסמכים והפניות שלכם, במקום אחד.
          </p>
        </div>
      </section>

      <main>
        <div className="max-w-brand mx-auto px-5 sm:px-8 py-8 sm:py-10">
          <PersonalAreaDashboard />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PersonalArea;
