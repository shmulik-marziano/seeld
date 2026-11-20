import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { BrowserRouter, Route, Routes, Outlet, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { AuthProvider } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Loader2 } from "lucide-react";
import ScrollToTop from "@/components/ScrollToTop";
import PageTransition from "@/components/PageTransition";
import AIChatBot from "@/components/AIChatBotLoader";
import AccessibilityButton from "@/components/AccessibilityButton";
import CookieConsent from "@/components/CookieConsent";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import ScrollProgress from "@/components/ScrollProgress";
import GridBackdrop from "@/components/brand/GridBackdrop";
import FloatingShapes from "@/components/FloatingShapes";
import RouteFallback from "@/components/RouteFallback";
import RouteSeo from "@/components/RouteSeo";
import { lazy, Suspense, useEffect, useRef } from "react";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, IS_V2 } from "@/integrations/supabase/config";
import { POA_ENABLED } from "@/lib/poa/config";
import { hasStoredSession, loadSiteSupabase } from "@/integrations/supabase/lazy";

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
  // /api/geo reads Vercel's own geo headers: same origin, no third party, no
  // CORS noise in the console. Capped so a missing route (local preview) never
  // delays the page-view insert; the miss is cached for the session.
  try {
    const res = await fetch("/api/geo", {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return { country: null, city: null };
    const data = await res.json();
    const geo = { country: data.country ?? null, city: data.city ?? null };
    sessionStorage.setItem("pv_geo", JSON.stringify(geo));
    return geo;
  } catch {
    const geo = { country: null, city: null };
    sessionStorage.setItem("pv_geo", JSON.stringify(geo));
    return geo;
  }
}

// The cookie banner writes "accepted" / "declined"; nothing until the visitor decides.
// Privacy rule for the page-view log: a declined visitor is not logged at all; an undecided
// visitor is logged without any identifier (no session id, no city); only an accepting
// visitor gets the session id that lets the ops console count sessions.
function analyticsConsent(): "accepted" | "declined" | null {
  try {
    const v = localStorage.getItem("cookie-consent");
    return v === "accepted" || v === "declined" ? v : null;
  } catch {
    return null;
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

    // Analytics is never worth a millisecond of the first paint: the geo lookup
    // and the Supabase insert both open a fresh connection, and on the landing
    // view they were competing with the fonts and the entry chunk for bandwidth.
    // Wait for the browser to go idle first.
    const send = async () => {
      const consent = analyticsConsent();
      if (consent === "declined") return;
      const ua = navigator.userAgent;
      const geo = await getGeoData();
      const row = {
        slug,
        device: detectDevice(ua),
        browser: detectBrowser(ua),
        referrer: document.referrer || null,
        session_id: consent === "accepted" ? getSessionId() : null,
        country: geo.country,
        city: consent === "accepted" ? geo.city : null,
      };
      if (hasStoredSession()) {
        // Logged-in visitor: keep going through the SDK so the insert carries
        // their JWT exactly as before.
        const supabase = await loadSiteSupabase();
        const { error } = await supabase.from("page_views").insert(row);
        if (error) console.warn("[PageView] insert failed:", error.message);
        return;
      }
      // Anonymous visitor (the common case): same PostgREST insert with the anon
      // key, via fetch — keeps the 45kB supabase-js SDK off every public page.
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/page_views`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(row),
          keepalive: true,
        });
        if (!res.ok) console.warn("[PageView] insert failed:", res.status);
      } catch (e) {
        console.warn("[PageView] insert failed:", (e as Error).message);
      }
    };

    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    // Deliberately not cancelled on cleanup: a visitor who moves on within the
    // idle window still visited this page, and dropping the row would quietly
    // undercount the fastest navigations.
    if (typeof w.requestIdleCallback === "function") {
      w.requestIdleCallback(() => { void send(); }, { timeout: 5000 });
    } else {
      window.setTimeout(() => { void send(); }, 2000);
    }
  }, [location.pathname]);

  return null;
}

// ── Homepage stays eager: it must render instantly with no fallback flash ──
import Index from "@/pages/Index";

// ── Agent App Pages (lazy) ──
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
const ReportApp = lazy(() => import("@/pages/app/ReportApp"));
// Ops Console (manager / super_admin only; role gate inside). Never imported by public pages.
const OpsRoutes = lazy(() => import("@/pages/app/ops/OpsRoutes"));
const QuestionnairesRoutes = lazy(() => import("@/pages/app/questionnaires/QuestionnairesRoutes"));
const ReportsRoutes = lazy(() => import("@/pages/app/reports/ReportsRoutes"));
const PoaFlow = lazy(() => import("@/pages/report-order/PoaFlow"));
const QuestionnaireClient = lazy(() => import("@/pages/QuestionnaireClient"));
const ReportPublic = lazy(() => import("@/pages/Report"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));

// ── Platform Tools (lazy) ──
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

// v2 holding screen for the areas rebuilt in phase 2 (lazy; never loaded by a legacy build)
const ComingSoon = lazy(() => import("@/pages/ComingSoon"));

// ── Public Site Pages (lazy) ──
const About = lazy(() => import("@/pages/About"));
const Learn = lazy(() => import("@/pages/Learn"));
const Authors = lazy(() => import("@/pages/Authors"));
const Contact = lazy(() => import("@/pages/Contact"));
const PortfolioReview = lazy(() => import("@/pages/PortfolioReview"));
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

// Insurance pages (lazy)
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

// Savings pages (lazy)
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
const RetirementPlanning = lazy(() => import("@/pages/savings/retirement/RetirementPlanning"));
const RetirementHow = lazy(() => import("@/pages/savings/retirement/HowItWorks"));
const RetirementCase = lazy(() => import("@/pages/savings/retirement/FieldStory"));
const RetirementFaq = lazy(() => import("@/pages/savings/retirement/RetirementFaq"));
const RetirementContact = lazy(() => import("@/pages/savings/retirement/RetirementContact"));
const RetirementChecklist = lazy(() => import("@/pages/savings/retirement/RetirementChecklist"));
const RiskProfile = lazy(() => import("@/pages/savings/RiskProfile"));

// Shared pages (lazy)
const TermsPage = lazy(() => import("@/pages/TermsPage"));
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// The database lives in ap-northeast-1 (Tokyo) while the users are in Israel —
// every round trip costs ~250ms before the query even runs. The library defaults
// (staleTime 0, refetchOnWindowFocus, retry 3) turned every tab-switch into a
// full refetch of every mounted query, which is what made the app feel stuck.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

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

// v2 (VITE_SEELD_BACKEND=v2): the personal area, client portal, agents app, site admin and the two forms
// that collect national id / bank details are not served; a calm holding screen replaces them.
// Legacy builds render `el` unchanged.
const hold = (el: JSX.Element, variant: "area" | "form" = "area") => (IS_V2 ? <ComingSoon variant={variant} /> : el);

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
    <MotionConfig reducedMotion="user">
    <AppProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            {/* v2 has no page_views table (FOUNDATION §17): the page-view log is legacy-only */}
            {!IS_V2 && <PageViewTracker />}
            <RouteSeo />
            <GridBackdrop />
            <ScrollProgress />
            <ScrollToTop />
            {/* Suspense sits ABOVE the transition on purpose: keyed on pathname,
                AnimatePresence tore the boundary down and rebuilt it on every
                navigation, so each lazy chunk remounted its fallback mid-fade. */}
            <Suspense fallback={<RouteFallback />}>
            <PageTransition>
              <Routes>
                {/* ═══ PUBLIC SITE ROUTES ═══ */}
                <Route path="/" element={<Index />} />
                {/* /about stays reachable from the footer, but it is no longer
                    a main-nav destination — מידע ולמידה took that slot. */}
                <Route path="/about" element={<About />} />
                <Route path="/learn" element={<Learn />} />
                <Route path="/authors" element={<Authors />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/portfolio-review" element={<PortfolioReview />} />
                <Route path="/onboarding" element={hold(<Onboarding />, "form")} />
                {/* Legacy password-based admin removed — SiteAdmin (Supabase auth) replaces it */}
                <Route path="/admin" element={<Navigate to="/site-admin" replace />} />
                <Route path="/site-admin" element={hold(<SiteAdmin />)} />
                <Route path="/direct-debit" element={hold(<DirectDebit />, "form")} />
                <Route path="/article/:id" element={<Article />} />
                <Route path="/calculators" element={<Calculators />} />
                <Route path="/return-tables" element={<ReturnTables />} />
                <Route path="/return-tables/:product" element={<ReturnTables />} />
                <Route path="/fund-finder" element={<FundFinder />} />
                <Route path="/saved-calculations" element={hold(<SavedCalculations />)} />
                <Route path="/personal-area" element={hold(<PersonalArea />)} />
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
                <Route path="/savings/retirement-planning" element={<RetirementPlanning />} />
                <Route path="/savings/retirement-planning/how-it-works" element={<RetirementHow />} />
                <Route path="/savings/retirement-planning/case-study" element={<RetirementCase />} />
                <Route path="/savings/retirement-planning/faq" element={<RetirementFaq />} />
                <Route path="/savings/retirement-planning/contact" element={<RetirementContact />} />
                <Route path="/savings/retirement-planning/checklist" element={<RetirementChecklist />} />
                <Route path="/savings/risk-profile" element={<RiskProfile />} />

                {/* Shared */}
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                {/* PWA removed — legacy install links land on the homepage */}
                <Route path="/install" element={<Navigate to="/" replace />} />

                {/* Agent Landing Page */}
                <Route path="/agents" element={<AgentLandingPage />} />
                <Route path="/report" element={<ReportPublic />} />
                {/* Public report engine: files are parsed in the browser only; no login (held in v2 until the new backend takes over). */}
                <Route path="/report/start" element={hold(<ReportsRoutes />)} />
                <Route path="/report/start/*" element={hold(<ReportsRoutes />)} />
                {/* POA wizard (docs/product/POA-WIZARD-SPEC.md §2): outside hold(); a static path outranks /report/start/* in React Router 6. Off by default. */}
                <Route path="/report/start/order" element={POA_ENABLED ? <PoaFlow /> : <Navigate to="/report/start" replace />} />

                {/* ═══ AGENT APP ROUTES (/app/*) ═══ */}
                {IS_V2 ? (
                  <>
                    <Route path="/q/:token" element={<ComingSoon />} />
                    <Route path="/portal/*" element={<ComingSoon />} />
                    <Route path="/execution-portal/*" element={<ComingSoon />} />
                    <Route path="/client/*" element={<ComingSoon />} />
                    <Route path="/app/*" element={<ComingSoon />} />
                    <Route path="/app" element={<ComingSoon />} />
                  </>
                ) : (
                <>
                <Route path="/q/:token" element={<QuestionnaireClient />} />
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
                  <Route path="/app/report" element={<ReportApp />} />
                  <Route path="/app/ops/*" element={<OpsRoutes />} />
                  <Route path="/app/questionnaires/*" element={<QuestionnairesRoutes />} />
                  <Route path="/app/reports" element={<ReportsRoutes />} />
                  <Route path="/app/reports/*" element={<ReportsRoutes />} />
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

                </>
                )}

                <Route path="*" element={<NotFound />} />
              </Routes>
            </PageTransition>
            </Suspense>

            <AIChatBot />
            <AccessibilityButton />
            <CookieConsent />

            <FloatingWhatsApp />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </AppProvider>
    </MotionConfig>
  </QueryClientProvider>
);

export default App;
