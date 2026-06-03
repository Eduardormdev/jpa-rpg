
-- Trigger para auto-atribuir admin a emails específicos quando se cadastram
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.email IN ('eduardorm.dev@gmail.com', 'paulo.brito.1313@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Cria os usuários admin diretamente
DO $$
DECLARE
  u_id UUID;
  emails TEXT[] := ARRAY['eduardorm.dev@gmail.com', 'paulo.brito.1313@gmail.com'];
  e TEXT;
BEGIN
  FOREACH e IN ARRAY emails LOOP
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = e) THEN
      u_id := gen_random_uuid();
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, confirmation_token, email_change,
        email_change_token_new, recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', u_id, 'authenticated', 'authenticated',
        e, crypt('bbTxB539yOWz', gen_salt('bf')),
        now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
        now(), now(), '', '', '', ''
      );
      INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
      VALUES (gen_random_uuid(), u_id, jsonb_build_object('sub', u_id::text, 'email', e), 'email', u_id::text, now(), now(), now());
    END IF;
  END LOOP;
END $$;
