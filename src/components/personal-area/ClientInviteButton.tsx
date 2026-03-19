import { useState } from "react";
import { siteSupabase } from "@/integrations/supabase/site-client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Send, Link2, Check, Copy } from "lucide-react";

interface ClientInviteButtonProps {
  customerEmail: string;
  customerName: string;
  variant?: "button" | "icon";
}

/**
 * Button for SEELD agents to send a personal-area login link to an existing customer.
 * Uses Supabase OTP (magic link) via the site Supabase instance.
 * The customer receives an email with a link that logs them into /personal-area.
 */
const ClientInviteButton = ({ customerEmail, customerName, variant = "button" }: ClientInviteButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendInvite = async () => {
    if (!customerEmail) {
      toast.error("ללקוח אין כתובת אימייל");
      return;
    }
    setLoading(true);
    try {
      const { error } = await siteSupabase.auth.signInWithOtp({
        email: customerEmail,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/personal-area`,
        },
      });
      if (error) throw error;
      setSent(true);
      toast.success(`לינק כניסה נשלח ל-${customerName} (${customerEmail})`);
      setTimeout(() => setSent(false), 5000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "שגיאה בשליחת הלינק");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/personal-area`;
    navigator.clipboard.writeText(link);
    toast.success("הקישור הועתק!");
  };

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleSendInvite}
        disabled={loading || sent}
        title={`שלח לינק כניסה ל-${customerName}`}
        className="text-[#0a3d3d] hover:bg-[#0a3d3d]/10"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : sent ? (
          <Check className="w-4 h-4 text-green-600" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleSendInvite}
        disabled={loading || sent}
        className="gap-2 rounded-full bg-[#0a3d3d] hover:bg-[#0d4a4a] shadow-lg shadow-[#0a3d3d]/20"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : sent ? (
          <>
            <Check className="w-4 h-4" />
            נשלח בהצלחה
          </>
        ) : (
          <>
            <Link2 className="w-4 h-4" />
            שלח לינק כניסה לאזור האישי
          </>
        )}
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={handleCopyLink}
        className="rounded-full border-gray-300"
        title="העתק קישור"
      >
        <Copy className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default ClientInviteButton;
