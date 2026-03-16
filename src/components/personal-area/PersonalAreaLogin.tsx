import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Loader2, Mail, ShieldCheck, ArrowRight } from "lucide-react";

const PersonalAreaLogin = () => {
  const [step, setStep] = useState<"choose" | "email" | "otp">("choose");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const { signInWithOtp, verifyOtp, signInWithGoogle, signInWithFacebook } = useAuth();
  const { toast } = useToast();

  const handleSocialLogin = async (provider: "google" | "facebook") => {
    setSocialLoading(provider);
    try {
      const fn = provider === "google" ? signInWithGoogle : signInWithFacebook;
      const { error } = await fn();
      if (error) throw error;
    } catch (error) {
      toast({
        title: "שגיאה בהתחברות",
        description: error instanceof Error ? error.message : "נסה שוב",
        variant: "destructive",
      });
      setSocialLoading(null);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { error } = await signInWithOtp(email);
      if (error) throw error;
      setStep("otp");
      toast({
        title: "קוד נשלח בהצלחה",
        description: `שלחנו קוד חד-פעמי לכתובת ${email}`,
      });
    } catch (error) {
      toast({
        title: "שגיאה בשליחת הקוד",
        description: error instanceof Error ? error.message : "נסה שוב",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      const { error } = await verifyOtp(email, otp);
      if (error) throw error;
      toast({ title: "התחברת בהצלחה!" });
    } catch (error) {
      toast({
        title: "קוד שגוי",
        description: "הקוד שהזנת אינו תקין, נסה שוב",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 sm:mt-12 px-4">
      <Card className="border border-gray-200 shadow-lg rounded-2xl">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#0a3d3d]/10 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-[#0a3d3d]" />
          </div>
          <CardTitle className="text-2xl text-[#0a3d3d]">האזור האישי שלך</CardTitle>
          <CardDescription className="text-base mt-2">
            {step === "choose" && "התחבר כדי לצפות בפוליסות ובמידע שלך"}
            {step === "email" && "הזן את כתובת המייל שלך ונשלח לך קוד חד-פעמי"}
            {step === "otp" && `הזן את הקוד שנשלח ל-${email}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {step === "choose" && (
            <>
              {/* Social login buttons */}
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-xl gap-3 text-sm font-medium border-gray-200 hover:bg-gray-50 min-h-[48px]"
                  onClick={() => handleSocialLogin("google")}
                  disabled={!!socialLoading}
                >
                  {socialLoading === "google" ? (
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

                <Button
                  variant="outline"
                  className="w-full h-12 rounded-xl gap-3 text-sm font-medium border-gray-200 hover:bg-gray-50 min-h-[48px]"
                  onClick={() => handleSocialLogin("facebook")}
                  disabled={!!socialLoading}
                >
                  {socialLoading === "facebook" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  )}
                  המשך עם Facebook
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">או עם אימייל</span>
                <Separator className="flex-1" />
              </div>

              <Button
                variant="outline"
                className="w-full h-12 rounded-xl gap-2 text-sm font-medium border-gray-200 hover:bg-gray-50 min-h-[48px]"
                onClick={() => setStep("email")}
              >
                <Mail className="h-4 w-4" />
                התחברות עם אימייל
              </Button>
            </>
          )}

          {step === "email" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">כתובת מייל</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    required
                    dir="ltr"
                    className="text-left pr-10 rounded-xl"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full min-h-[48px] text-base rounded-xl bg-[#0a3d3d] hover:bg-[#0a3d3d]/90" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    שלח קוד התחברות
                    <ArrowRight className="w-4 h-4 mr-2" />
                  </>
                )}
              </Button>
              <button
                type="button"
                onClick={() => setStep("choose")}
                className="w-full text-sm text-muted-foreground hover:text-foreground min-h-[44px]"
              >
                חזרה לאפשרויות התחברות
              </button>
            </form>
          )}

          {step === "otp" && (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <Label>קוד חד-פעמי (6 ספרות)</Label>
                <InputOTP maxLength={6} value={otp} onChange={setOtp} dir="ltr">
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button
                onClick={handleVerifyOtp}
                className="w-full min-h-[48px] text-base rounded-xl bg-[#0a3d3d] hover:bg-[#0a3d3d]/90"
                disabled={loading || otp.length !== 6}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "אמת והתחבר"}
              </Button>
              <div className="flex justify-between text-sm">
                <button
                  type="button"
                  onClick={() => { setStep("email"); setOtp(""); }}
                  className="text-[#0a3d3d] hover:underline min-h-[44px] px-2"
                >
                  שנה כתובת מייל
                </button>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="text-muted-foreground hover:underline min-h-[44px] px-2"
                  disabled={loading}
                >
                  שלח קוד מחדש
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonalAreaLogin;
