
-- Agency invitations table
CREATE TABLE public.agency_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'agent',
  status text NOT NULL DEFAULT 'pending',
  token text NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'::text),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  UNIQUE(agency_id, email)
);

ALTER TABLE public.agency_invitations ENABLE ROW LEVEL SECURITY;

-- Agency members can view invitations for their agency
CREATE POLICY "Agency members can view invitations"
  ON public.agency_invitations FOR SELECT TO authenticated
  USING (agency_id = get_user_agency_id(auth.uid()));

-- Agency members can insert invitations
CREATE POLICY "Agency members can insert invitations"
  ON public.agency_invitations FOR INSERT TO authenticated
  WITH CHECK (agency_id = get_user_agency_id(auth.uid()) AND invited_by = auth.uid());

-- Agency members can update invitations
CREATE POLICY "Agency members can update invitations"
  ON public.agency_invitations FOR UPDATE TO authenticated
  USING (agency_id = get_user_agency_id(auth.uid()));

-- Agency members can delete invitations
CREATE POLICY "Agency members can delete invitations"
  ON public.agency_invitations FOR DELETE TO authenticated
  USING (agency_id = get_user_agency_id(auth.uid()));

-- Public can read pending invitation by token (for signup flow)
CREATE POLICY "Public can read invitation by token"
  ON public.agency_invitations FOR SELECT TO anon
  USING (status = 'pending' AND (expires_at IS NULL OR expires_at > now()));
