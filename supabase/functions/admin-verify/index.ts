import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD") || "shmuel2025";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { password, action } = await req.json();

    if (!password || typeof password !== "string" || password.length > 100) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (password !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "סיסמה שגויה" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Password correct - use service role to fetch data
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (action === "fetch") {
      const [{ data: submissions, error: subErr }, { data: ddData }] = await Promise.all([
        supabase.from("onboarding_submissions").select("*").order("created_at", { ascending: false }),
        supabase.from("onboarding_submissions")
          .select("id,created_at,account_owner,bank_name,bank_branch,bank_account,bank_notes,status,first_name,last_name,phone,email")
          .not("bank_account", "is", null)
          .order("created_at", { ascending: false }),
      ]);

      if (subErr) {
        return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ submissions, ddSubmissions: ddData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default: just verify password
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-verify error:", e);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
