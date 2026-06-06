
-- 1. Restrict site_settings to admins only; expose safe public fields via a view
DROP POLICY IF EXISTS "Public read settings" ON public.site_settings;

CREATE POLICY "Admins read settings"
ON public.site_settings
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE VIEW public.public_site_settings AS
SELECT whatsapp_number, whatsapp_message, donation_url
FROM public.site_settings
WHERE id = 1;

GRANT SELECT ON public.public_site_settings TO anon, authenticated;

-- 2. Lock down user_roles: explicit restrictive policies prevent self-elevation via the Data API
CREATE POLICY "Deny role inserts via API"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

CREATE POLICY "Deny role updates via API"
ON public.user_roles
AS RESTRICTIVE
FOR UPDATE
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny role deletes via API"
ON public.user_roles
AS RESTRICTIVE
FOR DELETE
TO anon, authenticated
USING (false);

-- 3. Tighten "always true" public INSERT policies with input length guards
DROP POLICY IF EXISTS "Anyone send message" ON public.contact_messages;
CREATE POLICY "Anyone send message"
ON public.contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(name) BETWEEN 1 AND 200
  AND char_length(email) BETWEEN 3 AND 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND char_length(message) BETWEEN 1 AND 5000
  AND (subject IS NULL OR char_length(subject) <= 200)
);

DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe"
ON public.newsletter_subscribers
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(email) BETWEEN 3 AND 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND (name IS NULL OR char_length(name) <= 200)
);

-- 4. Revoke EXECUTE on SECURITY DEFINER functions from public/anon
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
