// admin-verify v18 — session-based auth (admin email corrected).
// v16 compared a shared password that leaked into a public GitHub repo and
// returned onboarding + bank-detail rows to anyone holding it. Since v17 the
// caller must present a valid Supabase session token belonging to an
// allow-listed admin email.
//
// Restored from the live deployment on 2026-08-22: the copy that sat here was
// the v16-era file, still carrying the shared-password path and an exec_sql RPC
// that no longer exists. `supabase functions deploy admin-verify` from this
// repo would have rolled the fix back and reopened the leak.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_EMAILS = ["shmulik@seeld-ins.co.il"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");

    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const { data: { user }, error: userErr } = await authClient.auth.getUser(token);

    const email = user?.email?.toLowerCase() ?? "";
    if (userErr || !user || !ADMIN_EMAILS.includes(email)) {
      return new Response(JSON.stringify({ error: "לא מורשה" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action } = await req.json().catch(() => ({ action: null }));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
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
