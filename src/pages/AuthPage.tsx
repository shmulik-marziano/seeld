import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, ArrowLeft, User, Phone, Building2, FileCheck, Shield, CheckCircle2, Sparkles, Users, BarChart3 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { LOGO_W } from '@/components/sd/client';
import { SdPic } from '@/components/sd/primitives';
import { BRAND_YEAR } from '@/lib/brandYear';
import { motion, AnimatePresence } from 'framer-motion';

const entityTypes = [
  'סוכנות ביטוח',
  'סוכן עצמאי',
  'יועץ פנסיוני',
  'יועץ השקעות',
  'משווק פנסיוני',
  'בית השקעות',
  'אחר',
];

const features = [
  { icon: Users, text: 'ניהול לקוחות חכם', desc: 'CRM מותאם לעולם הביטוח' },
  { icon: Sparkles, text: 'המלצות AI מותאמות', desc: 'ניתוח צרכים אוטומטי' },
  { icon: BarChart3, text: 'סיכום ביצועים מקצועי', desc: 'דוחות ודשבורדים בזמן אמת' },
];

export default function AuthPage() {
  const { session, needsOnboarding } = useApp();
  const [searchParams] = useSearchParams();
  const isOnboarding = searchParams.get('onboarding') === 'true' || needsOnboarding;
  const invitationToken = searchParams.get('invitation');
  const [mode, setMode] = useState<'login' | 'signup' | 'onboarding'>(
    isOnboarding && session ? 'onboarding' : invitationToken ? 'signup' : 'login'
  );
  const [loading, setLoading] = useState(false);
  const [pendingInvitation, setPendingInvitation] = useState<{ id: string; agency_id: string; email: string; token: string } | null>(null);

  // Check for invitation token
  useEffect(() => {
    if (invitationToken) {
      supabase.from('agency_invitations')
        .select('id, agency_id, email, token')
        .eq('token', invitationToken)
        .eq('status', 'pending')
        .single()
        .then(({ data }) => {
          if (data) {
            setPendingInvitation(data);
            setSignupForm(prev => ({ ...prev, email: data.email }));
          }
        });
    }
  }, [invitationToken]);

  // Switch to onboarding if needed
  useEffect(() => {
    if (isOnboarding && session && mode !== 'onboarding') setMode('onboarding');
  }, [isOnboarding, session, mode]);

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Signup fields
  const [signupForm, setSignupForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    agencyName: '',
    licenseNumber: '',
    entityType: 'סוכנות ביטוח',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  const setField = (key: string, value: string | boolean) =>
    setSignupForm(prev => ({ ...prev, [key]: value }));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('יש למלא אימייל וסיסמה'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('התחברת בהצלחה');
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message || 'שגיאה בהתחברות');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const f = signupForm;

    if (!pendingInvitation) {
      toast.error('הרשמה למערכת אפשרית רק באמצעות הזמנה. פנה למנהל המערכת.');
      return;
    }
    if (!f.fullName.trim()) { toast.error('יש להזין שם מלא'); return; }
    if (!f.email.trim()) { toast.error('יש להזין אימייל'); return; }
    if (!f.phone.trim()) { toast.error('יש להזין מספר טלפון'); return; }
    if (f.password.length < 8) { toast.error('הסיסמה חייבת להכיל לפחות 8 תווים'); return; }
    if (f.password !== f.confirmPassword) { toast.error('הסיסמאות אינן תואמות'); return; }
    if (!f.acceptTerms) { toast.error('יש לאשר את תנאי השימוש'); return; }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: f.email,
        password: f.password,
        options: {
          data: { full_name: f.fullName },
        },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('שגיאה ביצירת חשבון');

      const userId = authData.user.id;
      let agencyId: string;

      if (pendingInvitation) {
        agencyId = pendingInvitation.agency_id;
        await supabase.from('agency_invitations')
          .update({ status: 'accepted', accepted_at: new Date().toISOString() })
          .eq('id', pendingInvitation.id);
      } else {
        const { data: agency, error: agencyError } = await supabase.from('agencies').insert({
          name: f.agencyName,
          license_number: f.licenseNumber,
          entity_type: f.entityType,
          phone: f.phone,
          email: f.email,
        }).select().single();
        if (agencyError) throw agencyError;
        agencyId = agency.id;
      }

      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: userId,
        agency_id: agencyId,
        full_name: f.fullName,
        phone: f.phone,
        license_number: f.licenseNumber || null,
        role: pendingInvitation ? 'agent' : 'admin',
      });
      if (profileError) throw profileError;

      toast.success(pendingInvitation ? 'הצטרפת לסוכנות בהצלחה!' : 'נרשמת בהצלחה! מועבר למערכת...');
      window.location.href = '/app/dashboard';
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message || 'שגיאה בהרשמה');
    } finally {
      setLoading(false);
    }
  };

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    const f = signupForm;
    if (!f.fullName.trim()) { toast.error('יש להזין שם מלא'); return; }
    if (!f.phone.trim()) { toast.error('יש להזין מספר טלפון'); return; }
    if (!session?.user?.id) { toast.error('שגיאת אימות'); return; }

    const userEmail = session.user.email;
    let invitation = pendingInvitation;
    if (!invitation && userEmail) {
      const { data: inv } = await supabase.from('agency_invitations')
        .select('id, agency_id, email, token')
        .eq('email', userEmail.toLowerCase())
        .eq('status', 'pending')
        .single();
      if (inv) invitation = inv;
    }

    if (!invitation) {
      if (!f.agencyName.trim()) { toast.error('יש להזין שם סוכנות / גוף'); return; }
      if (!f.licenseNumber.trim()) { toast.error('יש להזין מספר רישיון'); return; }
    }
    if (!f.acceptTerms) { toast.error('יש לאשר את תנאי השימוש'); return; }

    setLoading(true);
    try {
      let agencyId: string;

      if (invitation) {
        agencyId = invitation.agency_id;
        await supabase.from('agency_invitations')
          .update({ status: 'accepted', accepted_at: new Date().toISOString() })
          .eq('id', invitation.id);
      } else {
        const { data: agency, error: agencyError } = await supabase.from('agencies').insert({
          name: f.agencyName,
          license_number: f.licenseNumber,
          entity_type: f.entityType,
          phone: f.phone,
          email: session.user.email || f.email,
        }).select().single();
        if (agencyError) throw agencyError;
        agencyId = agency.id;
      }

      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: session.user.id,
        agency_id: agencyId,
        full_name: f.fullName,
        phone: f.phone,
        license_number: f.licenseNumber || null,
        role: invitation ? 'agent' : 'admin',
      });
      if (profileError) throw profileError;

      toast.success(invitation ? 'הצטרפת לסוכנות בהצלחה!' : 'הפרופיל נוצר בהצלחה!');
      window.location.href = '/app/dashboard';
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message || 'שגיאה ביצירת פרופיל');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" dir="rtl">
      {/* Branding panel (lg+): pastel sky, illustration, what the system gives */}
      <div className="hidden lg:flex lg:w-[48%] relative items-center justify-center overflow-hidden"
        style={{ background: '#D6E3EF', borderInlineStart: '1px solid rgba(32,57,87,.14)' }}>
        <div className="relative z-10 px-14 py-10 max-w-[520px] w-full">
          <div className="flex items-center gap-3">
            <Link to="/" aria-label="שילד ביטוח ופיננסים, לדף הבית">
              <img src="/brand/logo.png" alt="שילד ביטוח ופיננסים" width={LOGO_W} height={44} style={{ height: 72, width: 'auto' }} decoding="async" />
            </Link>
          </div>
          <div className="mt-8" aria-hidden="true"><SdPic name="08-business-insurance" sizes="480px" priority /></div>
          <h2 className="mt-6 text-[30px] leading-tight font-bold" style={{ fontFamily: '"Frank Ruhl Libre", Georgia, serif', color: '#203957' }}>
            הפלטפורמה לסוכנויות ביטוח
          </h2>
          <ul className="mt-5 space-y-3">
            {features.map((feat) => (
              <li key={feat.text} className="flex items-center gap-4 rounded-2xl px-4 py-3 bg-white/70 border border-[#203957]/15">
                <span className="w-10 h-10 rounded-full bg-[#203957] flex items-center justify-center shrink-0" aria-hidden="true">
                  <feat.icon className="w-5 h-5 text-[#E7C98B]" />
                </span>
                <span>
                  <span className="block text-[16px] font-bold text-[#203957]">{feat.text}</span>
                  <span className="block text-[14px] text-[#55677C]">{feat.desc}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-6 flex items-center gap-2 text-[14px] text-[#55677C]">
            <Shield className="w-4 h-4" aria-hidden="true" /> הנתונים מוצפנים והגישה מאובטחת
          </p>
        </div>
      </div>

      {/* Left side -- form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-8 bg-background overflow-y-auto min-h-screen lg:min-h-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`w-full ${mode === 'signup' ? 'max-w-[480px]' : 'max-w-[420px]'}`}
        >
          {/* Mobile header: pastel sky with the illustration */}
          <div className="lg:hidden mb-6 rounded-3xl px-5 pt-6 text-center border border-[#203957]/15" style={{ background: '#D6E3EF' }}>
            <img src="/brand/logo.png" alt="שילד ביטוח ופיננסים" width={LOGO_W} height={44} style={{ height: 48, width: 'auto', margin: '0 auto' }} decoding="async" />
            <div className="mt-5 mx-auto max-w-[240px]" aria-hidden="true"><SdPic name="08-business-insurance" sizes="240px" priority /></div>
          </div>

          {/* Form card */}
          <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6 sm:p-8 space-y-5 sm:space-y-6">
            <div className="space-y-1.5">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                {mode === 'login' ? 'ברוך הבא' : mode === 'onboarding' ? 'השלמת הרשמה' : 'הרשמה למערכת'}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {mode === 'login'
                  ? 'התחבר כדי לנהל את הלקוחות שלך'
                  : mode === 'onboarding'
                  ? 'נשלים כמה פרטים כדי להתחיל'
                  : 'צור חשבון סוכנות חדש — הגדרה מהירה ומאובטחת'}
              </p>
            </div>

            {/* ============ LOGIN MODE ============ */}
            <AnimatePresence mode="wait">
              {mode === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 sm:space-y-5"
                >
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">אימייל</Label>
                      <div className="relative">
                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                        <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
                          placeholder="agent@example.com" className="placeholder:text-[#8593A3] h-12 sm:h-11 pr-10 rounded-xl text-base sm:text-sm border-border/70 focus-visible:ring-primary/30" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">סיסמה</Label>
                      <div className="relative">
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                        <Input type="password" value={password} onChange={e => setPassword(e.target.value)}
                          placeholder="••••••••" className="h-12 sm:h-11 pr-10 rounded-xl text-base sm:text-sm border-border/70 focus-visible:ring-primary/30" />
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-12 sm:h-11 rounded-xl gap-2 font-bold text-base sm:text-sm min-h-[48px] shadow-sm" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeft className="h-4 w-4" />}
                      התחבר
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* ============ SIGNUP MODE ============ */}
              {mode === 'signup' && (
                <motion.form
                  key="signup"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSignup}
                  className="space-y-4 sm:space-y-5"
                >
                  {/* Personal info */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                        <User className="h-3.5 w-3.5 text-primary" />
                      </div>
                      פרטים אישיים
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-medium">שם מלא *</Label>
                        <Input value={signupForm.fullName} onChange={e => setField('fullName', e.target.value)}
                          placeholder="ישראל ישראלי" className="h-12 sm:h-10 rounded-xl mt-1 text-base sm:text-sm border-border/70" />
                      </div>
                      <div>
                        <Label className="text-xs font-medium">טלפון *</Label>
                        <Input value={signupForm.phone} onChange={e => setField('phone', e.target.value)}
                          placeholder="050-1234567" className="h-12 sm:h-10 rounded-xl mt-1 text-base sm:text-sm border-border/70" dir="ltr" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">אימייל *</Label>
                      <div className="relative mt-1">
                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                        <Input type="email" value={signupForm.email} onChange={e => setField('email', e.target.value)}
                          placeholder="agent@agency.co.il" className="h-12 sm:h-10 pr-10 rounded-xl text-base sm:text-sm border-border/70" />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Agency info — only shown if NOT via invitation (self-reg disabled but kept for safety) */}
                  {!pendingInvitation && <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-3.5 w-3.5 text-primary" />
                      </div>
                      פרטי סוכנות / גוף מורשה
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-medium">שם סוכנות / גוף *</Label>
                        <Input value={signupForm.agencyName} onChange={e => setField('agencyName', e.target.value)}
                          placeholder="שם הסוכנות" className="h-12 sm:h-10 rounded-xl mt-1 text-base sm:text-sm border-border/70" />
                      </div>
                      <div>
                        <Label className="text-xs font-medium">מספר רישיון *</Label>
                        <Input value={signupForm.licenseNumber} onChange={e => setField('licenseNumber', e.target.value)}
                          placeholder="מספר רישיון RIA / סוכן" className="h-12 sm:h-10 rounded-xl mt-1 text-base sm:text-sm border-border/70" dir="ltr" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">סוג ישות *</Label>
                      <Select value={signupForm.entityType} onValueChange={v => setField('entityType', v)}>
                        <SelectTrigger className="h-12 sm:h-10 rounded-xl mt-1 text-base sm:text-sm border-border/70"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {entityTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>}

                  <Separator />

                  {/* Security */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Shield className="h-3.5 w-3.5 text-primary" />
                      </div>
                      אבטחה
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-medium">סיסמה *</Label>
                        <div className="relative mt-1">
                          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                          <Input type="password" value={signupForm.password} onChange={e => setField('password', e.target.value)}
                            placeholder="לפחות 8 תווים" className="h-12 sm:h-10 pr-10 rounded-xl text-base sm:text-sm border-border/70" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium">אימות סיסמה *</Label>
                        <div className="relative mt-1">
                          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                          <Input type="password" value={signupForm.confirmPassword} onChange={e => setField('confirmPassword', e.target.value)}
                            placeholder="הזן סיסמה שוב" className="h-12 sm:h-10 pr-10 rounded-xl text-base sm:text-sm border-border/70" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="flex items-start gap-3 pt-1">
                    <Checkbox
                      checked={signupForm.acceptTerms}
                      onCheckedChange={v => setField('acceptTerms', !!v)}
                      className="mt-0.5 h-5 w-5 sm:h-4 sm:w-4"
                    />
                    <label className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
                      onClick={() => setField('acceptTerms', !signupForm.acceptTerms)}>
                      אני מאשר/ת את תנאי השימוש ומדיניות הפרטיות של המערכת, ומצהיר/ה שאני בעל/ת רישיון תקף לעיסוק בתחום הפיננסי.
                    </label>
                  </div>

                  <Button type="submit" className="w-full h-12 rounded-xl gap-2 font-bold text-base min-h-[48px] shadow-sm" disabled={loading}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileCheck className="h-5 w-5" />}
                    צור חשבון סוכנות
                  </Button>
                </motion.form>
              )}

              {/* ============ ONBOARDING MODE ============ */}
              {mode === 'onboarding' && (
                <motion.form
                  key="onboarding"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleOnboarding}
                  className="space-y-4 sm:space-y-5"
                >
                  <div className="flex items-center gap-3 bg-primary/[0.06] border border-primary/10 rounded-xl p-3.5">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      נכנסת עם חשבון Google. כדי להתחיל, נשלים כמה פרטים על הסוכנות שלך.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                        <User className="h-3.5 w-3.5 text-primary" />
                      </div>
                      פרטים אישיים
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-medium">שם מלא *</Label>
                        <Input value={signupForm.fullName} onChange={e => setField('fullName', e.target.value)}
                          placeholder={session?.user?.user_metadata?.full_name || 'ישראל ישראלי'} className="h-12 sm:h-10 rounded-xl mt-1 text-base sm:text-sm border-border/70" />
                      </div>
                      <div>
                        <Label className="text-xs font-medium">טלפון *</Label>
                        <Input value={signupForm.phone} onChange={e => setField('phone', e.target.value)}
                          placeholder="050-1234567" className="h-12 sm:h-10 rounded-xl mt-1 text-base sm:text-sm border-border/70" dir="ltr" />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-3.5 w-3.5 text-primary" />
                      </div>
                      פרטי סוכנות / גוף מורשה
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-medium">שם סוכנות / גוף *</Label>
                        <Input value={signupForm.agencyName} onChange={e => setField('agencyName', e.target.value)}
                          placeholder="שם הסוכנות" className="h-12 sm:h-10 rounded-xl mt-1 text-base sm:text-sm border-border/70" />
                      </div>
                      <div>
                        <Label className="text-xs font-medium">מספר רישיון *</Label>
                        <Input value={signupForm.licenseNumber} onChange={e => setField('licenseNumber', e.target.value)}
                          placeholder="מספר רישיון" className="h-12 sm:h-10 rounded-xl mt-1 text-base sm:text-sm border-border/70" dir="ltr" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">סוג ישות *</Label>
                      <Select value={signupForm.entityType} onValueChange={v => setField('entityType', v)}>
                        <SelectTrigger className="h-12 sm:h-10 rounded-xl mt-1 text-base sm:text-sm border-border/70"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {entityTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-1">
                    <Checkbox checked={signupForm.acceptTerms} onCheckedChange={v => setField('acceptTerms', !!v)} className="mt-0.5 h-5 w-5 sm:h-4 sm:w-4" />
                    <label className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
                      onClick={() => setField('acceptTerms', !signupForm.acceptTerms)}>
                      אני מאשר/ת את תנאי השימוש ומצהיר/ה שאני בעל/ת רישיון תקף.
                    </label>
                  </div>

                  <Button type="submit" className="w-full h-12 rounded-xl gap-2 font-bold text-base min-h-[48px] shadow-sm" disabled={loading}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileCheck className="h-5 w-5" />}
                    השלם הרשמה
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>

            {mode !== 'onboarding' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center pt-1"
              >
                {mode === 'signup' ? (
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-sm text-primary hover:underline font-medium min-h-[44px] px-4 inline-flex items-center"
                  >
                    יש לך חשבון? התחבר
                  </button>
                ) : invitationToken ? (
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-sm text-primary hover:underline font-medium min-h-[44px] px-4 inline-flex items-center"
                  >
                    אין לך חשבון? הירשם עם ההזמנה
                  </button>
                ) : (
                  <p className="text-xs text-muted-foreground py-2">
                    הרשמה למערכת אפשרית רק באמצעות הזמנה מהמנהל
                  </p>
                )}
              </motion.div>
            )}
          </div>

          {/* Trust badges below card */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-4 mt-5 text-muted-foreground/50"
          >
            <div className="flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              <span className="text-[10px]">הצפנת SSL</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-muted-foreground/20" />
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3" />
              <span className="text-[10px]">מאובטח</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-muted-foreground/20" />
            <span className="text-[10px]">SEELD &copy; {BRAND_YEAR}</span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
