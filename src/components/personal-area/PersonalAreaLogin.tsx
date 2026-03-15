import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, ShieldCheck, ArrowRight } from "lucide-react";

const PersonalAreaLogin = () => {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const { signInWithOtp, verifyOtp } = useAuth();
  const { toast } = useToast();

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
    <div className="max-w-md mx-auto mt-12">
      <Card className="border-2 border-border/60 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">האזור האישי שלך</CardTitle>
          <CardDescription className="text-base mt-2">
            {step === "email"
              ? "הזן את כתובת המייל שלך ונשלח לך קוד חד-פעמי להתחברות"
              : `הזן את הקוד שנשלח ל-${email}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {step === "email" ? (
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
                    className="text-left pr-10"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full min-h-[48px] text-base" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    שלח קוד התחברות
                    <ArrowRight className="w-4 h-4 mr-2" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <Label>קוד חד-פעמי (6 ספרות)</Label>
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  dir="ltr"
                >
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
                className="w-full min-h-[48px] text-base"
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "אמת והתחבר"
                )}
              </Button>
              <div className="flex justify-between text-sm">
                <button
                  type="button"
                  onClick={() => { setStep("email"); setOtp(""); }}
                  className="text-primary hover:underline min-h-[44px] px-2"
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
