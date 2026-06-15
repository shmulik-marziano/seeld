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
import { lazy, Suspense, useEffect, useRef } from "react";
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

// ── Agent App Pages (lazy — keeps the heavy agent platform out of the public-site bundle) ──
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const CustomerListPage = lazy(() => import("@/pages/CustomerListPage"));
const NewCustomerPage = lazy(() => import("@/pages/NewCustomerPage"));
const CustomerCardPage = lazy(() => import("@/pages/CustomerCardPage"));
const FollowUpQueuePage = lazy(() => import("@/pages/FollowUpQueuePage"));
const ExecutionQueuePage = lazy(() => import("@/pages/ExecutionQueuePage"));
const ActivityLogPage = lazy(() => import("@/pages/ActivityLogPage"));
const ClientPortalPage = lazy(() => import("@/pages/ClientPortalPage"));
const NewRecommendationPage = lazy(() => import("@/pages/NewRecommendationPage"));
const RecommendationBankPage = lazy(() => import("@/pages/RecommendationBankPage"));
const ReasoningBankPage = lazy(() => import("@/pages/ReasoningBankPage"));
const ExecutionSummaryPage = lazy(() => import("@/pages/ExecutionSummaryPage"));
const ExecutionSummaryPortalPage = lazy(() => import("@/pages/ExecutionSummaryPortalPage"));
const AgencySettingsPage = lazy(() => import("@/pages/AgencySettingsPage"));
const FileImportPage = lazy(() => import("@/pages/FileImportPage"));
const LeadsPage = lazy(() => import("@/pages/LeadsPage"));
const HelpPage = lazy(() => import("@/pages/HelpPage"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const InstallPage = lazy(() => import("@/pages/InstallPage"));

// ── Platform Tools ──
const CatchPage = lazy(() => import("@/pages/tools/CatchPage"));
const LensPage = lazy(() => import("@/pages/tools/LensPage"));
const RevealPage = lazy(() => import("@/pages/tools/RevealPage"));
const XRayPage = lazy(() => import("@/pages/tools/XRayPage"));
const WiseToolPage = lazy(() => import("@/pages/tools/WisePage"));
const StagePage = lazy(() => import("@/pages/tools/StagePage"));
const SignPage = lazy(() => import("@/pages/tools/SignPage"));
const GatePage = lazy(() => import("@/pages/tools/GatePage"));
const FillPage = lazy(() => import("@/pages/tools/FillPage"));
const LaunchPage = lazy(() => import("@/pages/tools/LaunchPage"));
const FixPage = lazy(() => import("@/pages/tools/FixPage"));
const PulsePage = lazy(() => import("@/pages/tools/PulsePage"));
const BondPage = lazy(() => import("@/pages/tools/BondPage"));
const DeskPage = lazy(() => import("@/pages/tools/DeskPage"));
const ShieldPage = lazy(() => import("@/pages/tools/ShieldPage"));
const CoinPage = lazy(() => import("@/pages/tools/CoinPage"));
const LinkPage = lazy(() => import("@/pages/tools/LinkPage"));
const RadarPage = lazy(() => import("@/pages/tools/RadarPage"));
const BridgePage = lazy(() => import("@/pages/tools/BridgePage"));
const FlowPage = lazy(() => import("@/pages/tools/FlowPage"));
const BrainPage = lazy(() => import("@/pages/tools/BrainPage"));

// PDage module
import { PDageLayout } from "@/components/pdage/PDageLayout";
const PDageDashboard = lazy(() => import("@/pages/pdage/PDageDashboard"));
const PDageChatHome = lazy(() => import("@/pages/pdage/PDageChatHome"));
const PDageUpload = lazy(() => import("@/pages/pdage/PDageUpload"));
const PDageDeficiency = lazy(() => import("@/pages/pdage/PDageDeficiency"));
const PDageJobView = lazy(() => import("@/pages/pdage/PDageJobView"));
const PDageHistory = lazy(() => import("@/pages/pdage/PDageHistory"));
const PDageDeficiencyBank = lazy(() => import("@/pages/pdage/PDageDeficiencyBank"));
const PDageCorrectionRoom = lazy(() => import("@/pages/pdage/PDageCorrectionRoom"));

// ── Public Site Pages ──
// The homepage stays eager so first paint never waits on a second request.
import Index from "@/pages/Index";
const About = lazy(() => import("@/pages/About"));
const Authors = lazy(() => import("@/pages/Authors"));
const Contact = lazy(() => import("@/pages/Contact"));
const Calculators = lazy(() => import("@/pages/Calculators"));
const ReturnTables = lazy(() => import("@/pages/ReturnTables"));
const FundFinder = lazy(() => import("@/pages/FundFinder"));
const SavedCalculations = lazy(() => import("@/pages/SavedCalculations"));
const PersonalArea = lazy(() => import("@/pages/PersonalArea"));
const Insurances = lazy(() => import("@/pages/Insurances"));
const Savings = lazy(() => import("@/pages/Savings"));
const InvestmentTracks = lazy(() => import("@/pages/InvestmentTracks"));
const Article = lazy(() => import("@/pages/Article"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const Admin = lazy(() => import("@/pages/Admin"));
const SiteAdmin = lazy(() => import("@/pages/SiteAdmin"));
const DirectDebit = lazy(() => import("@/pages/DirectDebit"));
const StyleGuide = lazy(() => import("@/pages/StyleGuide"));
const FAQ = lazy(() => import("@/pages/FAQ"));
const Accessibility = lazy(() => import("@/pages/Accessibility"));
const CookiePolicy = lazy(() => import("@/pages/CookiePolicy"));
const RightsExtraction = lazy(() => import("@/pages/RightsExtraction"));
const Wellness = lazy(() => import("@/pages/Wellness"));
const Travel = lazy(() => import("@/pages/Travel"));
const Creativity = lazy(() => import("@/pages/Creativity"));
const Growth = lazy(() => import("@/pages/Growth"));
const AgentLandingPage = lazy(() => import("@/pages/AgentLandingPage"));
const Blog = lazy(() => import("@/pages/Blog"));
const BlogPost = lazy(() => import("@/pages/BlogPost"));

// Insurance pages
const HealthInsurance = lazy(() => import("@/pages/insurance/HealthInsurance"));
const CriticalIllness = lazy(() => import("@/pages/insurance/CriticalIllness"));
const PersonalAccidents = lazy(() => import("@/pages/insurance/PersonalAccidents"));
const LifeInsurance = lazy(() => import("@/pages/insurance/LifeInsurance"));
const MortgageInsurance = lazy(() => import("@/pages/insurance/MortgageInsurance"));
const PartnersRisk = lazy(() => import("@/pages/insurance/PartnersRisk"));
const VehicleInsurance = lazy(() => import("@/pages/insurance/VehicleInsurance"));
const HomeInsurance = lazy(() => import("@/pages/insurance/HomeInsurance"));
const RentersInsurance = lazy(() => import("@/pages/insurance/RentersInsurance"));
const BusinessInsurance = lazy(() => import("@/pages/insurance/BusinessInsurance"));
const TravelInsurance = lazy(() => import("@/pages/insurance/TravelInsurance"));
const DentalInsurance = lazy(() => import("@/pages/insurance/DentalInsurance"));
const DisabilityInsurance = lazy(() => import("@/pages/insurance/DisabilityInsurance"));
const ForeignWorkersInsurance = lazy(() => import("@/pages/insurance/ForeignWorkersInsurance"));
const NursingInsurance = lazy(() => import("@/pages/insurance/NursingInsurance"));
const NursingClalitInsurance = lazy(() => import("@/pages/insurance/NursingClalitInsurance"));

// Savings pages
const PensionFunds = lazy(() => import("@/pages/savings/PensionFunds"));
const GemelFunds = lazy(() => import("@/pages/savings/GemelFunds"));
const GemelInvestment = lazy(() => import("@/pages/savings/GemelInvestment"));
const ChildSavings = lazy(() => import("@/pages/savings/ChildSavings"));
const TrainingFunds = lazy(() => import("@/pages/savings/TrainingFunds"));
const Investment = lazy(() => import("@/pages/savings/Investment"));
const PensionLifeInsurance = lazy(() => import("@/pages/savings/PensionLifeInsurance"));
const EmployerFunds = lazy(() => import("@/pages/savings/EmployerFunds"));
const PreRetirement = lazy(() => import("@/pages/savings/PreRetirement"));
const PostRetirement = lazy(() => import("@/pages/savings/PostRetirement"));
const FinancialPlanning = lazy(() => import("@/pages/savings/FinancialPlanning"));

// Shared pages
const TermsPage = lazy(() => import("@/pages/TermsPage"));
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage"));
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

// Suspense fallback shown while a lazy route chunk loads
function RouteLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#1a1a4b]" />
    </div>
  );
}

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
      {/* Inner boundary: keep the layout shell visible while a lazy page chunk loads */}
      <Suspense fallback={<RouteLoader />}>
        <Outlet />
      </Suspense>
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
      <Suspense fallback={<RouteLoader />}>
        <Outlet />
      </Suspense>
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
              <Suspense fallback={<RouteLoader />}>
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
              </Suspense>
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
