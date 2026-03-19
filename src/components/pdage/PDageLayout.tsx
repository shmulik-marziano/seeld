import { ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, Menu, X, Upload, History, BookOpen, ArrowRight, MessageCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

const navItems = [
  { path: '/app/pdage', label: 'צ׳אט AI', icon: MessageCircle },
  { path: '/app/pdage/overview', label: 'דשבורד', icon: LayoutDashboard },
  { path: '/app/pdage/upload', label: 'העלאת מסמך', icon: Upload },
  { path: '/app/pdage/history', label: 'היסטוריית תיקונים', icon: History },
  { path: '/app/pdage/deficiency-bank', label: 'בנק חוסרים', icon: BookOpen },
];

export function PDageLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useApp();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

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
      {/* Brand header */}
      <div className="px-5 pt-6 pb-5 border-b border-sidebar-border/60 flex items-center justify-between">
        <button onClick={() => navigate('/app/pdage')} className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm shadow-md shadow-primary/10 group-hover:shadow-lg group-hover:shadow-primary/20 transition-shadow">
            pD
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-sidebar-foreground tracking-tight">pDage</h1>
            <p className="text-[10px] text-sidebar-foreground/35 font-light">ליקויים וחוסרים</p>
          </div>
        </button>
        {isMobile && (
          <button onClick={() => setSidebarOpen(false)} className="text-sidebar-foreground/50 hover:text-sidebar-foreground p-1.5 rounded-lg hover:bg-sidebar-accent/50 transition-colors">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-sidebar-primary/10 text-sidebar-primary font-semibold shadow-sm'
                  : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                isActive ? 'bg-sidebar-primary/15' : ''
              }`}>
                <item.icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-sidebar-primary' : ''}`} />
              </div>
              <span className="flex-1 text-right">{item.label}</span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border/60 space-y-0.5">
        <Button variant="ghost" size="sm" onClick={() => navigate('/app/dashboard')}
          className="w-full justify-start gap-2.5 text-sidebar-foreground/45 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 text-xs rounded-xl h-9">
          <ArrowRight className="h-3.5 w-3.5" />חזרה ל-SEELD
        </Button>
        <Button variant="ghost" size="sm" onClick={handleSignOut}
          className="w-full justify-start gap-2.5 text-sidebar-foreground/45 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 text-xs rounded-xl h-9">
          <LogOut className="h-3.5 w-3.5" />התנתק
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden" dir="rtl">
      {/* Mobile top bar */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-sidebar text-sidebar-foreground h-14 flex items-center px-4 gap-3 shadow-lg border-b border-sidebar-border/30">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-sidebar-accent/50 transition-colors">
            <Menu className="h-5 w-5" />
          </button>
          <button onClick={() => navigate('/app/pdage')} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-xs shadow-sm">pD</div>
            <h1 className="text-lg font-extrabold text-sidebar-primary tracking-tight">pDage</h1>
          </button>
        </div>
      )}

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        ${isMobile
          ? `fixed top-0 right-0 bottom-0 z-50 w-72 transform transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`
          : 'w-64 shrink-0'
        }
        bg-sidebar text-sidebar-foreground flex flex-col border-l border-sidebar-border/30
      `}>
        {sidebarContent}
      </aside>

      {/* Main content */}
      <main className={`flex-1 overflow-y-auto bg-background ${isMobile ? 'pt-14' : ''}`}>
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
