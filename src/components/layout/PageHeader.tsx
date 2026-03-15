import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Breadcrumb {
  label: string;
  path?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
  showHomeLink?: boolean;
}

export function PageHeader({ title, subtitle, icon, breadcrumbs, actions, showHomeLink = true }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="mb-6 space-y-2"
    >
      {/* Breadcrumbs */}
      {(breadcrumbs || showHomeLink) && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <button 
            onClick={() => navigate('/')} 
            className="hover:text-primary transition-colors flex items-center gap-1"
          >
            <Home className="h-3 w-3" />
            <span>ראשי</span>
          </button>
          {breadcrumbs?.map((bc, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <ChevronLeft className="h-3 w-3 text-muted-foreground/50" />
              {bc.path ? (
                <button onClick={() => navigate(bc.path!)} className="hover:text-primary transition-colors">
                  {bc.label}
                </button>
              ) : (
                <span className="text-foreground font-medium">{bc.label}</span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Title row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">{title}</h1>
            {subtitle && <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </motion.div>
  );
}
