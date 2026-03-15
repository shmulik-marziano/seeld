import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ClipboardCheck, UserPlus, Users, FileText, SkipForward, ArrowRight, ArrowLeft, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Step = 'entry' | 'pick-customer' | 'pick-recommendation';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSummaryWizard({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { data } = useApp();
  const [step, setStep] = useState<Step>('entry');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [skipRecommendation, setSkipRecommendation] = useState(false);

  const reset = () => {
    setStep('entry');
    setSelectedCustomerId(null);
    setCustomerSearch('');
    setSkipRecommendation(false);
  };

  const handleClose = (val: boolean) => {
    if (!val) reset();
    onOpenChange(val);
  };

  const filteredCustomers = data.customers.filter(c =>
    !customerSearch || c.fullName?.includes(customerSearch) || c.idNumber.includes(customerSearch)
  );

  const selectedCustomer = data.customers.find(c => c.id === selectedCustomerId);

  const customerRecs = selectedCustomerId
    ? data.recommendations.filter(r =>
        r.customerId === selectedCustomerId &&
        ['מאשר', 'עבר לביצוע', 'בוצע'].includes(r.decisionStatus)
      )
    : [];

  const handleNewCustomer = () => {
    handleClose(false);
    navigate('/app/customers/new?returnTo=execution-summary');
  };

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setStep('pick-recommendation');
  };

  const handleSkipAndCreate = () => {
    if (!selectedCustomerId) return;
    handleClose(false);
    navigate(`/execution-summary/${selectedCustomerId}?create=true`);
  };

  const handleFromRecommendation = (recId: string) => {
    if (!selectedCustomerId) return;
    handleClose(false);
    navigate(`/execution-summary/${selectedCustomerId}?create=true&recId=${recId}`);
  };

  const handleCreateForAllApproved = () => {
    if (!selectedCustomerId) return;
    handleClose(false);
    navigate(`/execution-summary/${selectedCustomerId}?create=true`);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            יצירת סיכום ביצועים
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Step 1: Entry point */}
          {step === 'entry' && (
            <motion.div
              key="entry"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3 mt-2"
            >
              <p className="text-sm text-muted-foreground">בחר את נקודת ההתחלה ליצירת סיכום:</p>

              <button
                onClick={() => setStep('pick-customer')}
                className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-transparent bg-accent/30 hover:border-primary/30 hover:bg-accent/60 transition-all text-right group"
              >
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <Users className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">לקוח קיים</p>
                  <p className="text-xs text-muted-foreground">בחר לקוח מהרשימה וצור סיכום</p>
                </div>
                <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>

              <button
                onClick={handleNewCustomer}
                className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-transparent bg-accent/30 hover:border-primary/30 hover:bg-accent/60 transition-all text-right group"
              >
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500/20 transition-colors">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">לקוח חדש</p>
                  <p className="text-xs text-muted-foreground">צור לקוח חדש ואז המשך לסיכום</p>
                </div>
                <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
              </button>
            </motion.div>
          )}

          {/* Step 2: Pick customer */}
          {step === 'pick-customer' && (
            <motion.div
              key="pick-customer"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="mt-2"
            >
              <div className="flex items-center gap-2 mb-3">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setStep('entry')}>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <p className="text-sm font-medium">בחר לקוח</p>
              </div>

              <div className="relative mb-3">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  placeholder="חפש לפי שם או ת.ז..."
                  className="pr-9"
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1">
                {filteredCustomers.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">לא נמצאו לקוחות</p>
                )}
                {filteredCustomers.slice(0, 20).map(c => {
                  const approvedCount = data.recommendations.filter(
                    r => r.customerId === c.id && ['מאשר', 'עבר לביצוע', 'בוצע'].includes(r.decisionStatus)
                  ).length;
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleSelectCustomer(c.id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-colors text-sm"
                    >
                      <div className="text-right">
                        <p className="font-medium">{c.fullName}</p>
                        <p className="text-xs text-muted-foreground">ת.ז {c.idNumber}</p>
                      </div>
                      {approvedCount > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          {approvedCount} המלצות מאושרות
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 3: Pick recommendation or skip */}
          {step === 'pick-recommendation' && selectedCustomer && (
            <motion.div
              key="pick-recommendation"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="mt-2"
            >
              <div className="flex items-center gap-2 mb-3">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setStep('pick-customer'); setSelectedCustomerId(null); }}>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <div>
                  <p className="text-sm font-medium">{selectedCustomer.fullName}</p>
                  <p className="text-[11px] text-muted-foreground">בחר איך ליצור את הסיכום</p>
                </div>
              </div>

              <div className="space-y-2">
                {/* Skip recommendation - create blank summary */}
                <button
                  onClick={handleSkipAndCreate}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/30 hover:bg-accent/40 transition-all text-right group"
                >
                  <div className="p-2 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <SkipForward className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">דלג על המלצה — צור סיכום ריק</p>
                    <p className="text-xs text-muted-foreground">תיעוד ביצוע ללא קשר להמלצה ספציפית</p>
                  </div>
                </button>

                {/* Create from all approved recommendations */}
                {customerRecs.length > 0 && (
                  <button
                    onClick={handleCreateForAllApproved}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-transparent bg-primary/5 hover:border-primary/30 hover:bg-primary/10 transition-all text-right group"
                  >
                    <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                      <ClipboardCheck className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">סיכום מכל ההמלצות המאושרות</p>
                      <p className="text-xs text-muted-foreground">{customerRecs.length} המלצות מאושרות</p>
                    </div>
                  </button>
                )}

                {/* Individual recommendations */}
                {customerRecs.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground font-medium mb-2 px-1">או בחר המלצה ספציפית:</p>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {customerRecs.map(rec => (
                        <button
                          key={rec.id}
                          onClick={() => handleFromRecommendation(rec.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors text-sm text-right"
                        >
                          <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="flex-1 truncate">{rec.title}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {rec.decisionStatus}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {customerRecs.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    אין המלצות מאושרות ללקוח זה. ניתן ליצור סיכום ריק.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
