
-- 1. Replace nominations INSERT policy so it's not USING/CHECK true
DROP POLICY IF EXISTS "Anyone can submit nominations" ON public.nominations;
CREATE POLICY "Anyone can submit valid nominations" ON public.nominations FOR INSERT TO anon, authenticated
  WITH CHECK (
    nominator_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND length(nominator_email) <= 254
    AND length(nominator_name) BETWEEN 1 AND 120
    AND length(nominee_name) BETWEEN 1 AND 120
    AND length(reason) BETWEEN 1 AND 4000
  );

-- 2. Drop the client-callable admin helper; replace with RLS on school_admins
DROP FUNCTION IF EXISTS public.current_user_is_admin();

CREATE POLICY "Users can see their own admin row" ON public.school_admins FOR SELECT TO authenticated
  USING (email = lower((auth.jwt() ->> 'email')));
