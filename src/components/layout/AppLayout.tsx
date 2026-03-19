import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { ChevronRight } from 'lucide-react';
import { CreateSummaryWizard } from '@/components/modals/CreateSummaryWizard';

export function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSummaryWizard, setShowSummaryWizard] = useState(false);

  const isDashboard = location.pathname === '/app/dashboard';

  return (
    <div
      className="flex flex-col min-h-screen"
      dir="rtl"
      style={{ backgroundColor: '#f8f9fc' }}
    >
      {/* Only show the back bar on non-dashboard pages */}
      {!isDashboard && (
        <div
          className="sticky top-0 z-40 flex items-center px-4 h-11 border-b border-gray-100/70"
          style={{ backgroundColor: 'rgba(248,249,252,0.95)', backdropFilter: 'blur(12px)' }}
        >
          <button
            onClick={() => navigate('/app/dashboard')}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-[#0a3d3d] transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
            SEELD PLATFORM
          </button>
        </div>
      )}

      <main className="flex-1 overflow-y-auto">
        <div className={isDashboard ? '' : 'p-3 sm:p-4 md:p-6'}>
          {children}
        </div>
      </main>

      <CreateSummaryWizard open={showSummaryWizard} onOpenChange={setShowSummaryWizard} />
    </div>
  );
}
