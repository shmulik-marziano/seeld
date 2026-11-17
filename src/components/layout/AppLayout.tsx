import { ReactNode, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useSdFont } from '@/components/sd/primitives';
import './app-shell.css';
import { CreateSummaryWizard } from '@/components/modals/CreateSummaryWizard';
import { TOOLS, PHASES, DECK, getToolsByPhase } from '@/config/tools';
import {
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  LayoutDashboard,
  Target,
  CheckSquare,
  MessageSquare,
  MoreHorizontal,
} from 'lucide-react';

export function AppLayout({ children }: { children: ReactNode }) {
  useSdFont();
  const navigate = useNavigate();
  const location = useLocation();
  const [showSummaryWizard, setShowSummaryWizard] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
  });

  const isDashboard = location.pathname === '/app/dashboard';
  const isAppRoute = location.pathname.startsWith('/app');

  const togglePhase = (phaseId: number) => {
    setExpandedPhases((prev) => ({ ...prev, [phaseId]: !prev[phaseId] }));
  };

  const isActive = (path: string) => location.pathname === path;
  const isToolActive = (slug: string) => location.pathname === `/app/tools/${slug}`;

  // Mobile bottom tabs
  const mobileBottomTabs = [
    { label: 'ראשי', icon: LayoutDashboard, path: '/app/dashboard' },
    { label: 'קליטה', icon: Target, path: '/app/tools/catch' },
    { label: 'משימות', icon: CheckSquare, path: '/app/tools/flow' },
    { label: 'הודעות', icon: MessageSquare, path: '/app/tools/bridge' },
    { label: 'עוד', icon: MoreHorizontal, path: '/app/tools' },
  ];

  // Non-app routes: just render with existing back-bar logic
  if (!isAppRoute) {
    return (
      <div className="app-shell flex flex-col min-h-screen" dir="rtl" style={{ backgroundColor: '#FCF8EF' }}>
        <main className="flex-1 overflow-y-auto">
          <div className="p-3 sm:p-4 md:p-6">{children}</div>
        </main>
        <CreateSummaryWizard open={showSummaryWizard} onOpenChange={setShowSummaryWizard} />
      </div>
    );
  }

  return (
    <div className="app-shell flex min-h-screen" dir="rtl" style={{ backgroundColor: '#FCF8EF' }}>
      {/* ── Sidebar (desktop only) ── */}
      <aside
        className={`app-sidebar hidden md:flex flex-col flex-shrink-0 bg-[#203957] border-l border-white/10 transition-all duration-200 ease-in-out ${
          sidebarCollapsed ? 'w-16' : 'w-60'
        }`}
        style={{ height: '100vh', position: 'sticky', top: 0 }}
      >
        {/* Brand */}
        <div className="flex items-center justify-between h-14 px-3 border-b border-white/10">
          {!sidebarCollapsed && (
            <Link to="/app/dashboard" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#FCF8EF] flex items-center justify-center">
                <span className="text-[#203957] text-sm font-bold" style={{ fontFamily: 'var(--app-serif)' }}>S</span>
              </div>
              <span className="text-base font-bold text-[#FCF8EF] tracking-wide" style={{ fontFamily: 'var(--app-serif)' }}>SEELD</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link to="/app/dashboard" className="mx-auto">
              <div className="w-7 h-7 rounded-lg bg-[#FCF8EF] flex items-center justify-center">
                <span className="text-[#203957] text-sm font-bold" style={{ fontFamily: 'var(--app-serif)' }}>S</span>
              </div>
            </Link>
          )}
          {!sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(true)}
              aria-label="צמצום סרגל צד" className="p-2 rounded hover:bg-white/10 text-[#C5D3E2] hover:text-white transition-colors"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scrollable nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {/* Deck link */}
          <Link
            to="/app/dashboard"
            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 mb-1 transition-colors ${
              isActive('/app/dashboard')
                ? 'app-nav-active bg-white/10 text-white font-bold'
                : 'text-[#D6E3EF] hover:bg-white/[0.06] hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 flex-shrink-0 text-[#E7C98B]" />
            {!sidebarCollapsed && <span className="text-sm">{DECK.hebrewName}</span>}
          </Link>

          <div className="h-px bg-white/10 my-2" />

          {/* Phase sections */}
          {PHASES.map((phase) => {
            const phaseTools = getToolsByPhase(phase.id);
            const isExpanded = expandedPhases[phase.id];

            return (
              <div key={phase.id} className="mb-1">
                {/* Phase header */}
                <button
                  onClick={() => !sidebarCollapsed && togglePhase(phase.id)}
                  className={`flex items-center w-full rounded-md px-2.5 py-1.5 transition-colors ${
                    sidebarCollapsed ? 'justify-center' : 'justify-between'
                  } hover:bg-white/[0.06]`}
                  title={sidebarCollapsed ? phase.label : undefined}
                >
                  {sidebarCollapsed ? (
                    <div className="w-2 h-2 rounded-full bg-[#E7C98B]" />
                  ) : (
                    <>
                      <span className="text-xs tracking-wide text-[#E7C98B] font-medium">
                        {phase.label}
                      </span>
                      <ChevronLeft
                        className={`w-3 h-3 text-[#C5D3E2] transition-transform ${
                          isExpanded ? '-rotate-90' : ''
                        }`}
                      />
                    </>
                  )}
                </button>

                {/* Tool items */}
                {(sidebarCollapsed || isExpanded) && (
                  <div className={sidebarCollapsed ? 'flex flex-col items-center gap-0.5 mt-0.5' : 'mt-0.5'}>
                    {phaseTools.map((tool) => {
                      const Icon = tool.icon;
                      const active = isToolActive(tool.slug);

                      return (
                        <Link
                          key={tool.slug}
                          to={`/app/tools/${tool.slug}`}
                          title={sidebarCollapsed ? tool.hebrewName : undefined}
                          className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors ${
                            active
                              ? 'app-nav-active bg-white/10 text-white font-bold'
                              : 'text-[#D6E3EF] hover:bg-white/[0.06] hover:text-white'
                          } ${sidebarCollapsed ? 'justify-center w-10 mx-auto' : ''}`}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0 text-[#C5D3E2]" />
                          {!sidebarCollapsed && (
                            <span className="text-sm flex items-center gap-2">
                              {tool.hebrewName}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-white/10 px-2 py-2">
          {/* Settings */}
          <Link
            to="/app/settings"
            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors ${
              isActive('/app/settings')
                ? 'app-nav-active bg-white/10 text-white font-bold'
                : 'text-[#D6E3EF] hover:bg-white/[0.06] hover:text-white'
            } ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <Settings className="w-4 h-4 flex-shrink-0 text-[#C5D3E2]" />
            {!sidebarCollapsed && <span className="text-sm">הגדרות</span>}
          </Link>

          {/* Collapse toggle (when collapsed) */}
          {sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(false)}
              aria-label="הרחבת סרגל צד" className="flex items-center justify-center w-full rounded-lg px-2.5 py-2 mt-1 text-[#C5D3E2] hover:bg-white/10 hover:text-white transition-colors"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* ── Main content area ── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Back bar for non-dashboard pages */}
        {!isDashboard && (
          <div
            className="sticky top-0 z-40 flex items-center px-4 h-11 border-b border-[#203957]/10 md:hidden"
            style={{ backgroundColor: 'rgba(252,248,239,0.95)', backdropFilter: 'blur(12px)' }}
          >
            <button
              onClick={() => navigate('/app/dashboard')}
              className="flex items-center gap-1.5 min-h-[44px] text-xs font-bold text-[#55677C] hover:text-[#203957] transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5 rotate-180" />
              SEELD פלטפורמה
            </button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <div className={isDashboard ? '' : 'p-3 sm:p-4 md:p-6'}>{children}</div>
        </main>
      </div>

      {/* ── Mobile bottom tab bar ── */}
      <div
        className="fixed bottom-0 inset-x-0 z-50 flex md:hidden items-center justify-around bg-[#203957] border-t border-white/10 h-14 px-1"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {mobileBottomTabs.map((tab) => {
          const Icon = tab.icon;
          const active =
            tab.path === '/app/dashboard'
              ? isActive('/app/dashboard')
              : tab.path === '/app/tools'
              ? false
              : location.pathname === tab.path;

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors ${
                active ? 'text-[#E7C98B]' : 'text-[#C5D3E2]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className={`text-[11px] ${active ? 'font-bold' : ''}`}>{tab.label}</span>
            </Link>
          );
        })}
      </div>

      <CreateSummaryWizard open={showSummaryWizard} onOpenChange={setShowSummaryWizard} />
    </div>
  );
}
