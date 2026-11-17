import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PersonalAreaLogin from "@/components/personal-area/PersonalAreaLogin";
import PersonalAreaDashboard from "@/components/personal-area/PersonalAreaDashboard";
import { SdPic, tintStyle, useSdFont } from "@/components/sd/primitives";
import { CaLoadingPage } from "@/components/sd/client";
import "@/components/sd/client.css";

const PersonalArea = () => {
  const { user, loading } = useAuth();
  useSdFont();

  if (loading) {
    return <CaLoadingPage label="טוען את האזור האישי" tint="sky" art="02-family-protection" />;
  }

  // Not signed in: the entry screen carries its own chrome
  if (!user) {
    return <PersonalAreaLogin />;
  }

  // Signed in: site chrome, a pastel title band with an illustration, the dashboard on cream
  return (
    <div className="sd min-h-screen" dir="rtl" style={tintStyle("sky")}>
      <Header />

      <section className="sd-ca-hero">
        <div className="sd-wrap sd-ca-hero-in">
          <div>
            <span className="sd-eyebrow">האזור האישי</span>
            <h1>הכול שלכם, במקום אחד.</h1>
            <p>הפוליסות, החיסכון, המסמכים והפניות שלכם, ומי שמלווה אתכם בדרך.</p>
          </div>
          <div className="sd-ca-hero-art" aria-hidden="true"><SdPic name="10-financial-planning" sizes="240px" priority /></div>
        </div>
      </section>

      <main>
        <div className="sd-wrap sd-ca-body">
          <PersonalAreaDashboard />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PersonalArea;
