
DROP VIEW IF EXISTS public.public_site_settings;

CREATE VIEW public.public_site_settings
WITH (security_invoker = true) AS
SELECT whatsapp_number, whatsapp_message, donation_url
FROM public.site_settings
WHERE id = 1;

GRANT SELECT ON public.public_site_settings TO anon, authenticated;

-- Allow the view (running as the caller) to read only the safe columns
CREATE POLICY "Public read safe settings fields"
ON public.site_settings
FOR SELECT
TO anon, authenticated
USING (id = 1);

-- The view only projects safe columns; the underlying admin-only fields
-- (notification_email) are never exposed because the view excludes them.
-- However the policy above would expose them via direct table queries,
-- so revoke direct column access to sensitive columns.
REVOKE SELECT ON public.site_settings FROM anon, authenticated;
GRANT SELECT (id, whatsapp_number, whatsapp_message, donation_url) ON public.site_settings TO anon, authenticated;
GRANT SELECT ON public.site_settings TO service_role;
