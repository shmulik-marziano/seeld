import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#5ec6c6]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero section */}
      <section className="relative bg-[#f8f9fc] overflow-hidden">
        <div className="absolute top-8 left-12 w-20 h-20 rounded-full bg-[#6c63ff] opacity-10" />
        <div className="absolute bottom-4 right-20 w-14 h-14 rounded-full bg-[#5ec6c6] opacity-15" />
        <svg className="absolute bottom-0 left-0 w-full h-16 opacity-10 pointer-events-none" viewBox="0 0 800 60" fill="none">
          <path d="M0 50 Q200 10 400 40 T800 20" stroke="#6c63ff" strokeWidth="2" strokeDasharray="8 6" />
          <polygon points="795,18 800,20 795,22" fill="#6c63ff" />
        </svg>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-16 relative z-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0a3d3d] mb-2">
            האזור האישי
          </h1>
          <p className="text-gray-500 text-lg">
            צפו בפוליסות, מסמכים והמלצות מותאמות אישית
          </p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {user ? <PersonalAreaDashboard /> : <PersonalAreaLogin />}
      </main>
      <Footer />
    </div>
  );
};

export default PersonalArea;
