import { ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, Menu, X, Upload, History, BookOpen, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

import { MessageCircle } from 'lucide-react';

const navItems = [
  { path: '/pdage', label: 'צ׳אט AI', icon: MessageCircle },
  { path: '/pdage/overview', label: 'דשבורד', icon: LayoutDashboard },
  { path: '/pdage/upload', label: 'העלאת מסמך', icon: Upload },
  { path: '/pdage/history', label: 'היסטוריית תיקונים', icon: History },
  { path: '/pdage/deficiency-bank', label: 'בנק חוסרים', icon: BookOpen },
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
    navigate('/auth');
  };

  const handleNav = (path: string) => {
    navigate(path);
    if (isMobile) setSidebarOpen(false);
  };

  const sidebarContent = (
    <>
      <div className="px-5 pt-6 pb-5 border-b border-sidebar-border flex items-center justify-between">
        <button onClick={() => navigate('/app/pdage')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm">
            pD
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground tracking-tight">pDage</h1>
            <p className="text-[10px] text-sidebar-foreground/40 font-light">ליקויים וחוסרים</p>
          </div>
        </button>
        {isMobile && (
          <button onClick={() => setSidebarOpen(false)} className="text-sidebar-foreground/70 hover:text-sidebar-foreground p-1">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary font-semibold'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-right">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-1">
        <Button variant="ghost" size="sm" onClick={() => navigate('/app/dashboard')} className="w-full justify-start gap-2 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 text-xs">
          <ArrowRight className="h-3.5 w-3.5" />חזרה ל-SeeID
        </Button>
        <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50">
          <LogOut className="h-3.5 w-3.5" />התנתק
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden" dir="rtl">
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-sidebar text-sidebar-foreground h-14 flex items-center px-4 gap-3 shadow-lg">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-sidebar-accent/50 transition-colors">
            <Menu className="h-5 w-5" />
          </button>
          <button onClick={() => navigate('/app/pdage')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-xs">pD</div>
            <h1 className="text-lg font-bold text-sidebar-primary">pDage</h1>
          </button>
        </div>
      )}

      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        ${isMobile
          ? `fixed top-0 right-0 bottom-0 z-50 w-72 transform transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`
          : 'w-64 shrink-0'
        }
        bg-sidebar text-sidebar-foreground flex flex-col
      `}>
        {sidebarContent}
      </aside>

      <main className={`flex-1 overflow-y-auto bg-background ${isMobile ? 'pt-14' : ''}`}>
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
