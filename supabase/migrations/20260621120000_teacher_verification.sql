-- Teacher verification workflow: pending approval before teacher role is granted.

CREATE TYPE public.verification_status AS ENUM (
  'not_applicable',
  'pending',
  'approved',
  'rejected'
);

ALTER TABLE public.profiles
  ADD COLUMN verification_status public.verification_status NOT NULL DEFAULT 'not_applicable';

-- Existing teachers are treated as already approved.
UPDATE public.profiles p
SET verification_status = 'approved'
FROM public.user_roles ur
WHERE ur.user_id = p.id AND ur.role = 'teacher';

CREATE INDEX idx_profiles_verification_status ON public.profiles(verification_status);

-- Replace signup trigger: block self-service admin, defer teacher role until approval.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _requested_role public.app_role;
  _verification public.verification_status;
  _roll TEXT;
BEGIN
  _requested_role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'student')::public.app_role;
  _roll := NULLIF(NEW.raw_user_meta_data->>'roll_number', '');

  -- Server-bootstrapped admin (never available via public registration).
  IF _requested_role = 'admin'
    AND COALESCE((NEW.raw_user_meta_data->>'bootstrap_admin')::boolean, false) THEN
    INSERT INTO public.profiles (
      id, email, full_name, roll_number, department, semester, verification_status
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Administrator'),
      NULL,
      NEW.raw_user_meta_data->>'department',
      NULL,
      'not_applicable'
    );
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
    RETURN NEW;
  END IF;

  -- Admin accounts are never created through public registration.
  IF _requested_role = 'admin' THEN
    _requested_role := 'student';
  END IF;

  IF _requested_role = 'teacher' THEN
    _verification := 'pending';
  ELSE
    _verification := 'not_applicable';
  END IF;

  INSERT INTO public.profiles (
    id, email, full_name, roll_number, department, semester, verification_status
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    _roll,
    NEW.raw_user_meta_data->>'department',
    NULLIF(NEW.raw_user_meta_data->>'semester', '')::INT,
    _verification
  );

  -- Students get immediate access; teachers wait for admin approval.
  IF _requested_role = 'student' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  END IF;

  RETURN NEW;
END;
$$;
