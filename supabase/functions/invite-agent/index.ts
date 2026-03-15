import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify the calling user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { email, agencyId, agencyName, inviterName } = await req.json();
    if (!email || !agencyId) throw new Error('Missing email or agencyId');

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check if invitation already exists
    const { data: existing } = await adminClient
      .from('agency_invitations')
      .select('id, status')
      .eq('agency_id', agencyId)
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existing && existing.status === 'pending') {
      throw new Error('הזמנה כבר נשלחה לכתובת זו');
    }

    if (existing && existing.status === 'accepted') {
      throw new Error('סוכן זה כבר חבר בסוכנות');
    }

    // Create or update invitation
    const { data: invitation, error: invError } = await adminClient
      .from('agency_invitations')
      .upsert({
        agency_id: agencyId,
        invited_by: user.id,
        email: email.toLowerCase().trim(),
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: 'agency_id,email' })
      .select()
      .single();

    if (invError) throw invError;

    // Try to invite via Supabase Auth (sends magic link email)
    const siteUrl = req.headers.get('origin') || 'https://seeld.co.il';
    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email.toLowerCase().trim(), {
      data: {
        invitation_id: invitation.id,
        agency_id: agencyId,
        agency_name: agencyName,
        invited_by_name: inviterName,
      },
      redirectTo: `${siteUrl}/auth?invitation=${invitation.token}`,
    });

    // If user already exists, that's fine - they'll see the invitation on login
    if (inviteError && !inviteError.message.includes('already been registered')) {
      console.error('Invite error:', inviteError);
      // Don't throw - invitation record is created, user can still sign up manually
    }

    return new Response(JSON.stringify({ success: true, invitation }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
