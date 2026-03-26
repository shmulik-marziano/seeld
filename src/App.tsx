import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Outlet, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { AuthProvider } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Loader2 } from "lucide-react";
import { PwaInstallBanner } from "@/components/pwa/PwaInstallBanner";
import ScrollToTop from "@/components/ScrollToTop";
import PageTransition from "@/components/PageTransition";
import AIChatBot from "@/components/AIChatBot";
import AccessibilityButton from "@/components/AccessibilityButton";
import CookieConsent from "@/components/CookieConsent";
import ScrollProgress from "@/components/ScrollProgress";
import FloatingShapes from "@/components/FloatingShapes";
import { useEffect, useRef } from "react";
import { siteSupabase } from "@/integrations/supabase/site-client";

// ── Page View Tracker ──
function detectDevice(ua: string): "mobile" | "tablet" | "desktop" {
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/i.test(ua)) return "mobile";
  return "desktop";
}

function detectBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return "Edge";
  if (/chrome|crios/i.test(ua) && !/edg\//i.test(ua)) return "Chrome";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) return "Safari";
  return "Other";
}

function getSessionId(): string {
  let sid = sessionStorage.getItem("pv_session_id");
  if (!sid) {
    sid = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem("pv_session_id", sid);
  }
  return sid;
}

async function getGeoData(): Promise<{ country: string | null; city: string | null }> {
  const cached = sessionStorage.getItem("pv_geo");
  if (cached) {
    try { return JSON.parse(cached); } catch { /* fall through */ }
  }
  try {
    const res = await fetch("https://ipapi.co/json/");
    if (!res.ok) return { country: null, city: null };
    const data = await res.json();
    const geo = { country: data.country_code ?? null, city: data.city ?? null };
    sessionStorage.setItem("pv_geo", JSON.stringify(geo));
    return geo;
  } catch {
    return { country: null, city: null };
  }
}

function PageViewTracker() {
  const location = useLocation();
  const lastPath = useRef<string>("");

  useEffect(() => {
    const slug = location.pathname;
    if (slug === lastPath.current) return;
    lastPath.current = slug;
    // Skip admin paths to avoid self-tracking
    if (slug.startsWith("/site-admin") || slug.startsWith("/admin")) return;

    // Non-blocking insert with enriched data
    (async () => {
      const ua = navigator.userAgent;
      const geo = await getGeoData();
      const row = {
        slug,
        device: detectDevice(ua),
        browser: detectBrowser(ua),
        referrer: document.referrer || null,
        session_id: getSessionId(),
        country: geo.country,
        city: geo.city,
      };
      const { error } = await siteSupabase.from("page_views" as any).insert(row);
      if (error) console.warn("[PageView] insert failed:", error.message);
    })();
  }, [location.pathname]);

  return null;
}

// ── Agent App Pages ──
import DashboardPage from "@/pages/DashboardPage";
import CustomerListPage from "@/pages/CustomerListPage";
import NewCustomerPage from "@/pages/NewCustomerPage";
import CustomerCardPage from "@/pages/CustomerCardPage";
import FollowUpQueuePage from "@/pages/FollowUpQueuePage";
import ExecutionQueuePage from "@/pages/ExecutionQueuePage";
import ActivityLogPage from "@/pages/ActivityLogPage";
import ClientPortalPage from "@/pages/ClientPortalPage";
import NewRecommendationPage from "@/pages/NewRecommendationPage";
import RecommendationBankPage from "@/pages/RecommendationBankPage";
import ReasoningBankPage from "@/pages/ReasoningBankPage";
import ExecutionSummaryPage from "@/pages/ExecutionSummaryPage";
import ExecutionSummaryPortalPage from "@/pages/ExecutionSummaryPortalPage";
import AgencySettingsPage from "@/pages/AgencySettingsPage";
import FileImportPage from "@/pages/FileImportPage";
import LeadsPage from "@/pages/LeadsPage";
import HelpPage from "@/pages/HelpPage";
import AuthPage from "@/pages/AuthPage";
import InstallPage from "@/pages/InstallPage";

// ── Platform Tools ──
import CatchPage from "@/pages/tools/CatchPage";
import LensPage from "@/pages/tools/LensPage";
import RevealPage from "@/pages/tools/RevealPage";
import XRayPage from "@/pages/tools/XRayPage";
import WiseToolPage from "@/pages/tools/WisePage";
import StagePage from "@/pages/tools/StagePage";
import SignPage from "@/pages/tools/SignPage";
import GatePage from "@/pages/tools/GatePage";
import FillPage from "@/pages/tools/FillPage";
import LaunchPage from "@/pages/tools/LaunchPage";
import FixPage from "@/pages/tools/FixPage";
import PulsePage from "@/pages/tools/PulsePage";
import BondPage from "@/pages/tools/BondPage";
import DeskPage from "@/pages/tools/DeskPage";
import ShieldPage from "@/pages/tools/ShieldPage";
import CoinPage from "@/pages/tools/CoinPage";
import LinkPage from "@/pages/tools/LinkPage";
import RadarPage from "@/pages/tools/RadarPage";
import BridgePage from "@/pages/tools/BridgePage";
import FlowPage from "@/pages/tools/FlowPage";
import BrainPage from "@/pages/tools/BrainPage";

// PDage module
import { PDageLayout } from "@/components/pdage/PDageLayout";
import PDageDashboard from "@/pages/pdage/PDageDashboard";
import PDageChatHome from "@/pages/pdage/PDageChatHome";
import PDageUpload from "@/pages/pdage/PDageUpload";
import PDageDeficiency from "@/pages/pdage/PDageDeficiency";
import PDageJobView from "@/pages/pdage/PDageJobView";
import PDageHistory from "@/pages/pdage/PDageHistory";
import PDageDeficiencyBank from "@/pages/pdage/PDageDeficiencyBank";
import PDageCorrectionRoom from "@/pages/pdage/PDageCorrectionRoom";

// ── Public Site Pages ──
import Index from "@/pages/Index";
import About from "@/pages/About";
import Authors from "@/pages/Authors";
import Contact from "@/pages/Contact";
import Calculators from "@/pages/Calculators";
import ReturnTables from "@/pages/ReturnTables";
import FundFinder from "@/pages/FundFinder";
import SavedCalculations from "@/pages/SavedCalculations";
import PersonalArea from "@/pages/PersonalArea";
import Insurances from "@/pages/Insurances";
import Savings from "@/pages/Savings";
import InvestmentTracks from "@/pages/InvestmentTracks";
import Article from "@/pages/Article";
import Onboarding from "@/pages/Onboarding";
import Admin from "@/pages/Admin";
import SiteAdmin from "@/pages/SiteAdmin";
import DirectDebit from "@/pages/DirectDebit";
import StyleGuide from "@/pages/StyleGuide";
import FAQ from "@/pages/FAQ";
import Accessibility from "@/pages/Accessibility";
import CookiePolicy from "@/pages/CookiePolicy";
import RightsExtraction from "@/pages/RightsExtraction";
import Wellness from "@/pages/Wellness";
import Travel from "@/pages/Travel";
import Creativity from "@/pages/Creativity";
import Growth from "@/pages/Growth";
import AgentLandingPage from "@/pages/AgentLandingPage";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";

// Insurance pages
import HealthInsurance from "@/pages/insurance/HealthInsurance";
import CriticalIllness from "@/pages/insurance/CriticalIllness";
import PersonalAccidents from "@/pages/insurance/PersonalAccidents";
import LifeInsurance from "@/pages/insurance/LifeInsurance";
import MortgageInsurance from "@/pages/insurance/MortgageInsurance";
import PartnersRisk from "@/pages/insurance/PartnersRisk";
import VehicleInsurance from "@/pages/insurance/VehicleInsurance";
import HomeInsurance from "@/pages/insurance/HomeInsurance";
import RentersInsurance from "@/pages/insurance/RentersInsurance";
import BusinessInsurance from "@/pages/insurance/BusinessInsurance";
import TravelInsurance from "@/pages/insurance/TravelInsurance";
import DentalInsurance from "@/pages/insurance/DentalInsurance";
import DisabilityInsurance from "@/pages/insurance/DisabilityInsurance";
import ForeignWorkersInsurance from "@/pages/insurance/ForeignWorkersInsurance";
import NursingInsurance from "@/pages/insurance/NursingInsurance";
import NursingClalitInsurance from "@/pages/insurance/NursingClalitInsurance";

// Savings pages
import PensionFunds from "@/pages/savings/PensionFunds";
import GemelFunds from "@/pages/savings/GemelFunds";
import GemelInvestment from "@/pages/savings/GemelInvestment";
import ChildSavings from "@/pages/savings/ChildSavings";
import TrainingFunds from "@/pages/savings/TrainingFunds";
import Investment from "@/pages/savings/Investment";
import PensionLifeInsurance from "@/pages/savings/PensionLifeInsurance";
import EmployerFunds from "@/pages/savings/EmployerFunds";
import PreRetirement from "@/pages/savings/PreRetirement";
import PostRetirement from "@/pages/savings/PostRetirement";
import FinancialPlanning from "@/pages/savings/FinancialPlanning";

// Shared pages
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

// ── Agent Auth Guards ──
function AgentAuthGuard() {
  const { session, loading, needsOnboarding } = useApp();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  if (!session) return <Navigate to="/app/auth" replace />;
  if (needsOnboarding) return <Navigate to="/app/auth?onboarding=true" replace />;
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

function PDageAuthGuard() {
  const { session, loading } = useApp();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  if (!session) return <Navigate to="/app/auth" replace />;
  return (
    <PDageLayout>
      <Outlet />
    </PDageLayout>
  );
}

function AgentAuthRoute() {
  const { session, loading, needsOnboarding } = useApp();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  if (session && !needsOnboarding) return <Navigate to="/app/dashboard" replace />;
  return <AuthPage />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <PwaInstallBanner />
          <BrowserRouter>
            <PageViewTracker />
            <ScrollProgress />
            <ScrollToTop />
            <PageTransition>
              <Routes>
                {/* ═══ PUBLIC SITE ROUTES ═══ */}
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<About />} />
                <Route path="/authors" element={<Authors />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/site-admin" element={<SiteAdmin />} />
                <Route path="/direct-debit" element={<DirectDebit />} />
                <Route path="/article/:id" element={<Article />} />
                <Route path="/calculators" element={<Calculators />} />
                <Route path="/return-tables" element={<ReturnTables />} />
                <Route path="/fund-finder" element={<FundFinder />} />
                <Route path="/saved-calculations" element={<SavedCalculations />} />
                <Route path="/personal-area" element={<PersonalArea />} />
                <Route path="/style-guide" element={<StyleGuide />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/accessibility" element={<Accessibility />} />
                <Route path="/cookie-policy" element={<CookiePolicy />} />
                <Route path="/rights-extraction" element={<RightsExtraction />} />
                <Route path="/wellness" element={<Wellness />} />
                <Route path="/travel" element={<Travel />} />
                <Route path="/creativity" element={<Creativity />} />
                <Route path="/growth" element={<Growth />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />

                {/* Insurance */}
                <Route path="/insurances" element={<Insurances />} />
                <Route path="/savings" element={<Savings />} />
                <Route path="/investment-tracks" element={<InvestmentTracks />} />
                <Route path="/insurance/health" element={<HealthInsurance />} />
                <Route path="/insurance/critical-illness" element={<CriticalIllness />} />
                <Route path="/insurance/accidents" element={<PersonalAccidents />} />
                <Route path="/insurance/life" element={<LifeInsurance />} />
                <Route path="/insurance/mortgage" element={<MortgageInsurance />} />
                <Route path="/insurance/partners" element={<PartnersRisk />} />
                <Route path="/insurance/vehicle" element={<VehicleInsurance />} />
                <Route path="/insurance/home" element={<HomeInsurance />} />
                <Route path="/insurance/renters" element={<RentersInsurance />} />
                <Route path="/insurance/business" element={<BusinessInsurance />} />
                <Route path="/insurance/travel" element={<TravelInsurance />} />
                <Route path="/insurance/dental" element={<DentalInsurance />} />
                <Route path="/insurance/disability" element={<DisabilityInsurance />} />
                <Route path="/insurance/foreign-workers" element={<ForeignWorkersInsurance />} />
                <Route path="/insurance/nursing" element={<NursingInsurance />} />
                <Route path="/insurance/nursing-clalit" element={<NursingClalitInsurance />} />

                {/* Savings */}
                <Route path="/savings/pension-funds" element={<PensionFunds />} />
                <Route path="/savings/gemel-funds" element={<GemelFunds />} />
                <Route path="/savings/gemel-investment" element={<GemelInvestment />} />
                <Route path="/savings/child-savings" element={<ChildSavings />} />
                <Route path="/savings/training-funds" element={<TrainingFunds />} />
                <Route path="/savings/investment" element={<Investment />} />
                <Route path="/savings/pension-life-insurance" element={<PensionLifeInsurance />} />
                <Route path="/savings/employer-funds" element={<EmployerFunds />} />
                <Route path="/savings/pre-retirement" element={<PreRetirement />} />
                <Route path="/savings/post-retirement" element={<PostRetirement />} />
                <Route path="/savings/financial-planning" element={<FinancialPlanning />} />

                {/* Shared */}
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/install" element={<InstallPage />} />

                {/* Agent Landing Page */}
                <Route path="/agents" element={<AgentLandingPage />} />

                {/* ═══ AGENT APP ROUTES (/app/*) ═══ */}
                <Route path="/portal/:token" element={<ClientPortalPage />} />
                <Route path="/execution-portal/:token" element={<ExecutionSummaryPortalPage />} />
                <Route path="/client/:id" element={<ClientPortalPage />} />

                <Route path="/app/auth" element={<AgentAuthRoute />} />

                <Route element={<AgentAuthGuard />}>
                  <Route path="/app/dashboard" element={<DashboardPage />} />
                  <Route path="/app/customers" element={<CustomerListPage />} />
                  <Route path="/app/customers/new" element={<NewCustomerPage />} />
                  <Route path="/app/customers/:id" element={<CustomerCardPage />} />
                  <Route path="/app/recommendations/new" element={<NewRecommendationPage />} />
                  <Route path="/app/recommendation-bank" element={<RecommendationBankPage />} />
                  <Route path="/app/reasoning-bank" element={<ReasoningBankPage />} />
                  <Route path="/app/follow-up" element={<FollowUpQueuePage />} />
                  <Route path="/app/execution" element={<ExecutionQueuePage />} />
                  <Route path="/app/execution-summary/:customerId" element={<ExecutionSummaryPage />} />
                  <Route path="/app/activity-log" element={<ActivityLogPage />} />
                  <Route path="/app/file-import" element={<FileImportPage />} />
                  <Route path="/app/leads" element={<LeadsPage />} />
                  <Route path="/app/help" element={<HelpPage />} />
                  <Route path="/app/settings" element={<AgencySettingsPage />} />

                  {/* ═══ PLATFORM TOOLS ═══ */}
                  {/* Phase 1: Entry */}
                  <Route path="/app/tools/catch" element={<CatchPage />} />
                  <Route path="/app/tools/lens" element={<LensPage />} />
                  <Route path="/app/tools/reveal" element={<RevealPage />} />
                  {/* Phase 2: Analysis */}
                  <Route path="/app/tools/x-ray" element={<XRayPage />} />
                  <Route path="/app/tools/wise" element={<WiseToolPage />} />
                  <Route path="/app/tools/stage" element={<StagePage />} />
                  {/* Phase 3: Execution */}
                  <Route path="/app/tools/sign" element={<SignPage />} />
                  <Route path="/app/tools/gate" element={<GatePage />} />
                  <Route path="/app/tools/fill" element={<FillPage />} />
                  <Route path="/app/tools/launch" element={<LaunchPage />} />
                  <Route path="/app/tools/fix" element={<FixPage />} />
                  <Route path="/app/tools/pulse" element={<PulsePage />} />
                  {/* Phase 4: Maintenance */}
                  <Route path="/app/tools/bond" element={<BondPage />} />
                  <Route path="/app/tools/desk" element={<DeskPage />} />
                  <Route path="/app/tools/shield" element={<ShieldPage />} />
                  <Route path="/app/tools/coin" element={<CoinPage />} />
                  <Route path="/app/tools/link" element={<LinkPage />} />
                  {/* Phase 5: Infrastructure */}
                  <Route path="/app/tools/radar" element={<RadarPage />} />
                  <Route path="/app/tools/bridge" element={<BridgePage />} />
                  <Route path="/app/tools/flow" element={<FlowPage />} />
                  <Route path="/app/tools/brain" element={<BrainPage />} />
                </Route>

                <Route element={<PDageAuthGuard />}>
                  <Route path="/app/pdage" element={<PDageChatHome />} />
                  <Route path="/app/pdage/overview" element={<PDageDashboard />} />
                  <Route path="/app/pdage/upload" element={<PDageUpload />} />
                  <Route path="/app/pdage/job/:jobId/deficiency" element={<PDageDeficiency />} />
                  <Route path="/app/pdage/job/:jobId" element={<PDageJobView />} />
                  <Route path="/app/pdage/job/:jobId/room" element={<PDageCorrectionRoom />} />
                  <Route path="/app/pdage/history" element={<PDageHistory />} />
                  <Route path="/app/pdage/deficiency-bank" element={<PDageDeficiencyBank />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </PageTransition>

            <AIChatBot />
            <AccessibilityButton />
            <CookieConsent />

            {/* WhatsApp */}
            <a
              href="https://wa.me/972523097444"
              target="_blank"
              rel="noopener noreferrer"
              className="fixed bottom-24 left-4 z-50 group"
              aria-label="שלח הודעה בוואטסאפ"
            >
              <div className="relative flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(37,211,102,0.6)]"
                style={{ background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)" }}
              >
                <div className="absolute inset-0 rounded-full animate-ping opacity-30"
                  style={{ background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)" }}
                />
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white relative z-10" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.243-1.214l-.252-.157-2.625.78.78-2.625-.157-.252A8 8 0 1112 20z"/>
                </svg>
              </div>
            </a>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
