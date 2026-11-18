-- Allow admins to delete profiles of agents in their agency (not themselves)
CREATE POLICY "Admins can delete agency profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  agency_id = get_user_agency_id(auth.uid())
  AND user_id != auth.uid()
);