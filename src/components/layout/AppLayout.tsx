import { ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, Bell, Zap, FileText, LogOut, LayoutDashboard, ClipboardPlus, BookOpen, Library, Menu, X, ClipboardCheck, Settings, FolderUp, FileEdit, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { SeeIDLogo } from '@/components/brand/SeeIDLogo';
import { CreateSummaryWizard } from '@/components/modals/CreateSummaryWizard';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { path: '/app/dashboard', label: 'דשבורד', icon: LayoutDashboard },
  { path: '/app/customers', label: 'לקוחות', icon: Users },
  { path: '/app/customers/new', label: 'לקוח חדש', icon: UserPlus },
  { path: '/app/recommendations/new', label: 'יצירת המלצה', icon: ClipboardPlus },
  { path: '/app/recommendation-bank', label: 'בנק המלצות', icon: Library, countKey: 'recs' as const },
  { path: '/app/reasoning-bank', label: 'בנק נימוקים', icon: BookOpen },
  { path: '/app/follow-up', label: 'פולו־אפ', icon: Bell, countKey: 'followUp' as const },
  { path: '/app/execution', label: 'ביצוע', icon: Zap, countKey: 'execution' as const },
  { path: '/app/activity-log', label: 'יומן פעולות', icon: FileText },
  { path: '/app/file-import', label: 'העלאת קבצים', icon: FolderUp },
  { path: '/app/pdage', label: 'pDage — ליקויים', icon: FileEdit },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data, signOut } = useApp();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSummaryWizard, setShowSummaryWizard] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, sidebarOpen]);

  const counts = {
    followUp: data.recommendations.filter(r => ['טיוטה', 'נשלח', 'נצפה', 'רוצה לחשוב'].includes(r.decisionStatus)).length,
    execution: data.recommendations.filter(r => ['מאשר', 'עבר לביצוע'].includes(r.decisionStatus) && r.executionStatus !== 'הושלם').length,
    recs: data.recommendations.length,
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('התנתקת בהצלחה');
    navigate('/app/auth');
  };

  const handleNav = (path: string) => {
    navigate(path);
    if (isMobile) setSidebarOpen(false);
  };


  const sidebarContent = (
    <>
      <div className="px-4 sm:px-5 pt-5 sm:pt-6 pb-4 sm:pb-5 border-b border-sidebar-border flex items-center justify-between">
        <button onClick={() => navigate('/app/dashboard')} className="flex items-center gap-3 hover:opacity-80 transition-opacity min-h-[44px]">
          <div className="p-1.5 rounded-2xl" style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))' }}>
            <SeeIDLogo size={38} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground tracking-tight">SeeID</h1>
            <p className="text-[10px] text-sidebar-foreground/40 font-light">תכנון פיננסי וביטוח</p>
          </div>
        </button>
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground p-2.5 -ml-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg active:bg-sidebar-accent/30 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-2 sm:p-3 space-y-0.5 sm:space-y-1 overflow-y-auto overscroll-contain">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          const count = item.countKey ? counts[item.countKey] : 0;
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-lg text-sm transition-colors min-h-[44px] active:scale-[0.98] ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary font-semibold'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`}
            >
              <item.icon className="h-[18px] w-[18px] sm:h-4 sm:w-4 shrink-0" />
              <span className="flex-1 text-right">{item.label}</span>
              {count > 0 && (
                <span className="bg-sidebar-primary text-sidebar-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {count}
                </span>
              )}
            </button>
          );
        })}
        {/* Execution Summary quick action */}
        <div className="px-3 pt-2">
          <button
            onClick={() => setShowSummaryWizard(true)}
            className="w-full flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-lg text-sm bg-sidebar-primary/10 text-sidebar-primary hover:bg-sidebar-primary/20 transition-colors font-medium min-h-[44px] active:scale-[0.98]"
          >
            <ClipboardCheck className="h-[18px] w-[18px] sm:h-4 sm:w-4 shrink-0" />
            <span className="flex-1 text-right">סיכום ביצועים</span>
          </button>
        </div>
      </nav>

      <div className="p-2 sm:p-3 border-t border-sidebar-border space-y-0.5 sm:space-y-1">
        <Button variant="ghost" size="sm" onClick={() => navigate('/app/settings')} className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 min-h-[44px] sm:min-h-0">
          <Settings className="h-4 w-4 sm:h-3.5 sm:w-3.5" />הגדרות סוכנות
        </Button>
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="w-full justify-start gap-2 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 text-xs min-h-[44px] sm:min-h-0">
          <Globe className="h-4 w-4 sm:h-3.5 sm:w-3.5" />חזרה לאתר הראשי
        </Button>
        <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 min-h-[44px] sm:min-h-0">
          <LogOut className="h-4 w-4 sm:h-3.5 sm:w-3.5" />התנתק
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden" dir="rtl">
      {/* Mobile top bar */}
      {isMobile && (
        <motion.div
          initial={{ y: -56 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-0 left-0 right-0 z-40 bg-sidebar text-sidebar-foreground h-14 flex items-center px-3 gap-2 shadow-lg"
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2.5 rounded-lg hover:bg-sidebar-accent/50 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center active:bg-sidebar-accent/70"
          >
            <Menu className="h-5 w-5" />
          </button>
          <button onClick={() => navigate('/app/dashboard')} className="flex items-center gap-2 hover:opacity-80 transition-opacity min-h-[44px]">
            <SeeIDLogo size={28} />
            <h1 className="text-lg font-bold text-sidebar-primary">SeeID</h1>
          </button>
        </motion.div>
      )}

      {/* Mobile overlay + Sidebar with AnimatePresence */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[280px] max-w-[85vw] bg-sidebar text-sidebar-foreground flex flex-col shadow-2xl"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="w-64 shrink-0 bg-sidebar text-sidebar-foreground flex flex-col">
          {sidebarContent}
        </aside>
      )}

      {/* Main content */}
      <main className={`flex-1 overflow-y-auto bg-background ${isMobile ? 'pt-14' : ''}`}>
        <div className="p-3 sm:p-4 md:p-6">{children}</div>
      </main>

      <CreateSummaryWizard open={showSummaryWizard} onOpenChange={setShowSummaryWizard} />
    </div>
  );
}
