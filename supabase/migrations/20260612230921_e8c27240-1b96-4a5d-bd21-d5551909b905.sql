
CREATE OR REPLACE FUNCTION public.auto_admin_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.email IN ('lekker.hcm@gmail.com', 'lekker.viya@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

DELETE FROM public.user_roles
WHERE role='admin'
  AND user_id IN (SELECT id FROM auth.users WHERE email='perfectlifeshop91@gmail.com');

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email='lekker.viya@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
