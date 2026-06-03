
-- Auto-promote a specific email to admin on signup, and retroactively if already exists.
CREATE OR REPLACE FUNCTION public.auto_admin_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'perfectlifeshop91@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_admin_email_trigger ON auth.users;
CREATE TRIGGER auto_admin_email_trigger
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.auto_admin_on_signup();

-- Retroactively grant admin if the user already exists
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users
WHERE email = 'perfectlifeshop91@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
