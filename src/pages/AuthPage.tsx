import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, ArrowLeft, User, Phone, Building2, FileCheck, Shield } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { SeeIDLogo } from '@/components/brand/SeeIDLogo';
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

export default function AuthPage() {
  const { session, needsOnboarding } = useApp();
  const [searchParams] = useSearchParams();
  const isOnboarding = searchParams.get('onboarding') === 'true' || needsOnboarding;
  const invitationToken = searchParams.get('invitation');
  const [mode, setMode] = useState<'login' | 'signup' | 'onboarding'>(isOnboarding && session ? 'onboarding' : 'login');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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
            // Pre-fill email if in signup mode
            setSignupForm(prev => ({ ...prev, email: data.email }));
          }
        });
    }
  }, [invitationToken]);

  // Switch to onboarding if needed
  useEffect(() => {
    if (isOnboarding && session && mode !== 'onboarding') setMode('onboarding');
  }, [isOnboarding, session]);

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

  const setField = (key: string, value: any) =>
    setSignupForm(prev => ({ ...prev, [key]: value }));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('יש למלא אימייל וסיסמה'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('התחברת בהצלחה');
    } catch (err: any) {
      toast.error(err.message || 'שגיאה בהתחברות');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const f = signupForm;

    if (!f.fullName.trim()) { toast.error('יש להזין שם מלא'); return; }
    if (!f.email.trim()) { toast.error('יש להזין אימייל'); return; }
    if (!f.phone.trim()) { toast.error('יש להזין מספר טלפון'); return; }
    // Agency fields only required if NOT joining via invitation
    if (!pendingInvitation) {
      if (!f.agencyName.trim()) { toast.error('יש להזין שם סוכנות / גוף'); return; }
      if (!f.licenseNumber.trim()) { toast.error('יש להזין מספר רישיון'); return; }
    }
    if (f.password.length < 8) { toast.error('הסיסמה חייבת להכיל לפחות 8 תווים'); return; }
    if (f.password !== f.confirmPassword) { toast.error('הסיסמאות אינן תואמות'); return; }
    if (!f.acceptTerms) { toast.error('יש לאשר את תנאי השימוש'); return; }

    setLoading(true);
    try {
      // 1. Create auth user
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
        // Join existing agency via invitation
        agencyId = pendingInvitation.agency_id;

        // Mark invitation as accepted
        await supabase.from('agency_invitations')
          .update({ status: 'accepted', accepted_at: new Date().toISOString() })
          .eq('id', pendingInvitation.id);
      } else {
        // 2. Create new agency
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

      // 3. Create profile
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
    } catch (err: any) {
      toast.error(err.message || 'שגיאה בהרשמה');
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

    // Check for pending invitation by email
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
    } catch (err: any) {
      toast.error(err.message || 'שגיאה ביצירת פרופיל');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/app/auth',
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || 'שגיאה בהתחברות עם Google');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" dir="rtl">
      {/* Right side -- branding hero (hidden on mobile, shown on lg+) */}
      <div className="hidden lg:flex lg:w-[45%] relative items-center justify-center overflow-hidden bg-[#f8f9fc]">

        <div className="absolute inset-0">
          <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 6, repeat: Infinity }}
            className="absolute top-[15%] right-[20%] w-16 h-16 rounded-full bg-[#5ec6c6] opacity-20" />
          <motion.div animate={{ y: [0, 12, 0] }} transition={{ duration: 8, repeat: Infinity, delay: 1 }}
            className="absolute top-[35%] left-[15%] w-12 h-12 rounded-full bg-[#6c63ff] opacity-15" />
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 7, repeat: Infinity, delay: 2 }}
            className="absolute bottom-[25%] right-[30%] w-10 h-10 rounded-full bg-[#f4a261] opacity-20" />
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
            className="absolute bottom-[40%] left-[25%] w-14 h-14 rounded-full bg-[#e76f51] opacity-15" />
          {/* Dashed curved line */}
          <svg className="absolute bottom-10 left-0 w-full h-24 opacity-10 pointer-events-none" viewBox="0 0 400 80" fill="none">
            <path d="M0 60 Q100 10 200 45 T400 25" stroke="#5ec6c6" strokeWidth="2" strokeDasharray="8 6" />
            <polygon points="395,23 400,25 395,27" fill="#5ec6c6" />
          </svg>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-12 space-y-6"
        >
          <SeeIDLogo size={100} />
          <div className="space-y-3">
            <h2 className="text-4xl font-extrabold text-[#0a3d3d] tracking-tight">SeeID</h2>
            <p className="text-lg text-gray-500 font-light">תכנון פיננסי וביטוח</p>
          </div>
          <div className="pt-4 space-y-2.5">
            {['ניהול לקוחות חכם', 'המלצות AI מותאמות', 'פורטל לקוח דיגיטלי', 'סיכום ביצועים מקצועי'].map((text, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.15 }}
                className="flex items-center gap-2 justify-center text-gray-400 text-sm"
              >
                <div className="w-2 h-2 rounded-full bg-[#5ec6c6]" />
                {text}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Left side -- form (full screen on mobile) */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-8 bg-background overflow-y-auto min-h-screen lg:min-h-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`w-full ${mode === 'signup' ? 'max-w-[480px]' : 'max-w-[400px]'} space-y-5 sm:space-y-6`}
        >
          {/* Mobile logo - with gradient background */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:hidden flex flex-col items-center gap-3 pb-2"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center shadow-lg bg-[#f8f9fc] border border-gray-100">
              <SeeIDLogo size={50} />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-extrabold text-foreground">SeeID</h2>
              <p className="text-xs text-muted-foreground">תכנון פיננסי וביטוח</p>
            </div>
          </motion.div>

          <div className="space-y-1.5 sm:space-y-2">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              {mode === 'login' ? 'ברוך הבא' : 'הרשמה למערכת'}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {mode === 'login'
                ? 'התחבר כדי לנהל את הלקוחות שלך'
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
                <Button
                  variant="outline"
                  className="w-full gap-3 h-12 sm:h-12 rounded-full text-sm font-medium border-border/80 hover:bg-muted/50 min-h-[48px]"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                >
                  {googleLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  )}
                  המשך עם Google
                </Button>

                <div className="flex items-center gap-3">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground font-medium">או עם אימייל</span>
                  <Separator className="flex-1" />
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">אימייל</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                      <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="agent@example.com" className="h-12 sm:h-11 pr-10 rounded-xl text-base sm:text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">סיסמה</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                      <Input type="password" value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••" className="h-12 sm:h-11 pr-10 rounded-xl text-base sm:text-sm" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 sm:h-11 rounded-full gap-2 font-semibold text-base sm:text-sm min-h-[48px]" disabled={loading}>
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
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground mb-2">
                    <User className="h-3.5 w-3.5 text-primary" />
                    פרטים אישיים
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium">שם מלא *</Label>
                      <Input value={signupForm.fullName} onChange={e => setField('fullName', e.target.value)}
                        placeholder="ישראל ישראלי" className="h-12 sm:h-10 rounded-xl mt-1 text-base sm:text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">טלפון *</Label>
                      <Input value={signupForm.phone} onChange={e => setField('phone', e.target.value)}
                        placeholder="050-1234567" className="h-12 sm:h-10 rounded-xl mt-1 text-base sm:text-sm" dir="ltr" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium">אימייל *</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                      <Input type="email" value={signupForm.email} onChange={e => setField('email', e.target.value)}
                        placeholder="agent@agency.co.il" className="h-12 sm:h-10 pr-10 rounded-xl text-base sm:text-sm" />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Agency info */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground mb-2">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    פרטי סוכנות / גוף מורשה
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium">שם סוכנות / גוף *</Label>
                      <Input value={signupForm.agencyName} onChange={e => setField('agencyName', e.target.value)}
                        placeholder="שם הסוכנות" className="h-12 sm:h-10 rounded-xl mt-1 text-base sm:text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">מספר רישיון *</Label>
                      <Input value={signupForm.licenseNumber} onChange={e => setField('licenseNumber', e.target.value)}
                        placeholder="מספר רישיון RIA / סוכן" className="h-12 sm:h-10 rounded-xl mt-1 text-base sm:text-sm" dir="ltr" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium">סוג ישות *</Label>
                    <Select value={signupForm.entityType} onValueChange={v => setField('entityType', v)}>
                      <SelectTrigger className="h-12 sm:h-10 rounded-xl mt-1 text-base sm:text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {entityTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Security */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground mb-2">
                    <Shield className="h-3.5 w-3.5 text-primary" />
                    אבטחה
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium">סיסמה *</Label>
                      <div className="relative mt-1">
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                        <Input type="password" value={signupForm.password} onChange={e => setField('password', e.target.value)}
                          placeholder="לפחות 8 תווים" className="h-12 sm:h-10 pr-10 rounded-xl text-base sm:text-sm" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">אימות סיסמה *</Label>
                      <div className="relative mt-1">
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                        <Input type="password" value={signupForm.confirmPassword} onChange={e => setField('confirmPassword', e.target.value)}
                          placeholder="הזן סיסמה שוב" className="h-12 sm:h-10 pr-10 rounded-xl text-base sm:text-sm" />
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

                <Button type="submit" className="w-full h-12 rounded-full gap-2 font-bold text-base min-h-[48px]" disabled={loading}>
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
                <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 text-xs sm:text-sm text-muted-foreground">
                  נכנסת עם חשבון Google. כדי להתחיל, נשלים כמה פרטים על הסוכנות שלך.
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground mb-2">
                    <User className="h-3.5 w-3.5 text-primary" />
                    פרטים אישיים
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium">שם מלא *</Label>
                      <Input value={signupForm.fullName} onChange={e => setField('fullName', e.target.value)}
                        placeholder={session?.user?.user_metadata?.full_name || 'ישראל ישראלי'} className="h-12 sm:h-10 rounded-xl mt-1 text-base sm:text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">טלפון *</Label>
                      <Input value={signupForm.phone} onChange={e => setField('phone', e.target.value)}
                        placeholder="050-1234567" className="h-12 sm:h-10 rounded-xl mt-1 text-base sm:text-sm" dir="ltr" />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground mb-2">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    פרטי סוכנות / גוף מורשה
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium">שם סוכנות / גוף *</Label>
                      <Input value={signupForm.agencyName} onChange={e => setField('agencyName', e.target.value)}
                        placeholder="שם הסוכנות" className="h-12 sm:h-10 rounded-xl mt-1 text-base sm:text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">מספר רישיון *</Label>
                      <Input value={signupForm.licenseNumber} onChange={e => setField('licenseNumber', e.target.value)}
                        placeholder="מספר רישיון" className="h-12 sm:h-10 rounded-xl mt-1 text-base sm:text-sm" dir="ltr" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium">סוג ישות *</Label>
                    <Select value={signupForm.entityType} onValueChange={v => setField('entityType', v)}>
                      <SelectTrigger className="h-12 sm:h-10 rounded-xl mt-1 text-base sm:text-sm"><SelectValue /></SelectTrigger>
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

                <Button type="submit" className="w-full h-12 rounded-full gap-2 font-bold text-base min-h-[48px]" disabled={loading}>
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
              className="text-center pt-2 pb-4"
            >
              <button
                type="button"
                onClick={() => setMode(m => m === 'login' ? 'signup' : 'login')}
                className="text-sm text-primary hover:underline font-medium min-h-[44px] px-4 inline-flex items-center"
              >
                {mode === 'login' ? 'אין לך חשבון? הירשם עכשיו' : 'יש לך חשבון? התחבר'}
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
