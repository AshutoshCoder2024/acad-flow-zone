-- Ensures the env-configured administrator account has the admin role (not student).

CREATE OR REPLACE FUNCTION public.ensure_admin_role(_expected_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT email INTO _user_email FROM public.profiles WHERE id = auth.uid();

  IF _user_email IS NULL OR lower(_user_email) <> lower(_expected_email) THEN
    RAISE EXCEPTION 'Not authorized for administrator access';
  END IF;

  DELETE FROM public.user_roles
  WHERE user_id = auth.uid() AND role = 'student';

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_admin_role(text) TO authenticated;
