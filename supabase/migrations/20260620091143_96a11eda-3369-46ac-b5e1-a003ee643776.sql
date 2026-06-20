
-- =========================================
-- ENUMS
-- =========================================
CREATE TYPE public.app_role AS ENUM ('student', 'teacher', 'admin');
CREATE TYPE public.notice_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.resource_type AS ENUM ('notes', 'pyq', 'lab_manual');
CREATE TYPE public.event_status AS ENUM ('upcoming', 'completed');
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent');

-- =========================================
-- updated_at trigger function
-- =========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =========================================
-- PROFILES
-- =========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  roll_number TEXT UNIQUE,
  department TEXT,
  semester INT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_profiles_roll_number ON public.profiles(roll_number);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- USER ROLES
-- =========================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role helper (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- get_my_roles helper (returns array of caller's roles)
CREATE OR REPLACE FUNCTION public.get_my_roles()
RETURNS public.app_role[]
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(role), ARRAY[]::public.app_role[])
  FROM public.user_roles WHERE user_id = auth.uid()
$$;

-- =========================================
-- Signup trigger: create profile + assign role from metadata
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role public.app_role;
  _roll TEXT;
BEGIN
  _role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role',''), 'student')::public.app_role;
  _roll := NULLIF(NEW.raw_user_meta_data->>'roll_number', '');

  INSERT INTO public.profiles (id, email, full_name, roll_number, department, semester)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    _roll,
    NEW.raw_user_meta_data->>'department',
    NULLIF(NEW.raw_user_meta_data->>'semester','')::INT
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- PROFILES policies
-- =========================================
CREATE POLICY "Authenticated can view profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins update any profile" ON public.profiles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- USER_ROLES policies
-- =========================================
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- NOTICES
-- =========================================
CREATE TABLE public.notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority public.notice_priority NOT NULL DEFAULT 'medium',
  attachment_url TEXT,
  attachment_name TEXT,
  posted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_role public.app_role,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notices_created_at ON public.notices(created_at DESC);
CREATE INDEX idx_notices_priority ON public.notices(priority);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notices TO authenticated;
GRANT ALL ON public.notices TO service_role;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_notices_updated_at BEFORE UPDATE ON public.notices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Authenticated view notices" ON public.notices
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers admins create notices" ON public.notices
  FOR INSERT TO authenticated WITH CHECK (
    (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin'))
    AND posted_by = auth.uid()
  );
CREATE POLICY "Authors and admins update notices" ON public.notices
  FOR UPDATE TO authenticated USING (
    posted_by = auth.uid() OR public.has_role(auth.uid(),'admin')
  );
CREATE POLICY "Authors and admins delete notices" ON public.notices
  FOR DELETE TO authenticated USING (
    posted_by = auth.uid() OR public.has_role(auth.uid(),'admin')
  );

-- =========================================
-- RESOURCES (notes / pyq / lab_manual unified)
-- =========================================
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  semester INT NOT NULL,
  type public.resource_type NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_resources_semester_subject ON public.resources(semester, subject);
CREATE INDEX idx_resources_type ON public.resources(type);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.resources TO authenticated;
GRANT ALL ON public.resources TO service_role;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_resources_updated_at BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Authenticated view resources" ON public.resources
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers admins create resources" ON public.resources
  FOR INSERT TO authenticated WITH CHECK (
    (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin'))
    AND uploaded_by = auth.uid()
  );
CREATE POLICY "Owners admins update resources" ON public.resources
  FOR UPDATE TO authenticated USING (
    uploaded_by = auth.uid() OR public.has_role(auth.uid(),'admin')
  );
CREATE POLICY "Owners admins delete resources" ON public.resources
  FOR DELETE TO authenticated USING (
    uploaded_by = auth.uid() OR public.has_role(auth.uid(),'admin')
  );

-- =========================================
-- EVENTS
-- =========================================
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  status public.event_status NOT NULL DEFAULT 'upcoming',
  registration_link TEXT,
  cover_url TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_events_date ON public.events(event_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Authenticated view events" ON public.events
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers admins create events" ON public.events
  FOR INSERT TO authenticated WITH CHECK (
    (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin'))
    AND created_by = auth.uid()
  );
CREATE POLICY "Owners admins update events" ON public.events
  FOR UPDATE TO authenticated USING (
    created_by = auth.uid() OR public.has_role(auth.uid(),'admin')
  );
CREATE POLICY "Owners admins delete events" ON public.events
  FOR DELETE TO authenticated USING (
    created_by = auth.uid() OR public.has_role(auth.uid(),'admin')
  );

-- =========================================
-- GALLERY
-- =========================================
CREATE TABLE public.gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_gallery_event ON public.gallery(event_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery TO authenticated;
GRANT ALL ON public.gallery TO service_role;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view gallery" ON public.gallery
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers admins add gallery" ON public.gallery
  FOR INSERT TO authenticated WITH CHECK (
    (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin'))
    AND uploaded_by = auth.uid()
  );
CREATE POLICY "Owners admins delete gallery" ON public.gallery
  FOR DELETE TO authenticated USING (
    uploaded_by = auth.uid() OR public.has_role(auth.uid(),'admin')
  );

-- =========================================
-- ATTENDANCE
-- =========================================
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  date DATE NOT NULL,
  status public.attendance_status NOT NULL,
  marked_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, subject, date)
);
CREATE INDEX idx_attendance_student ON public.attendance(student_id);
CREATE INDEX idx_attendance_subject_date ON public.attendance(subject, date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own attendance" ON public.attendance
  FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Teachers admins view all attendance" ON public.attendance
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin')
  );
CREATE POLICY "Teachers admins insert attendance" ON public.attendance
  FOR INSERT TO authenticated WITH CHECK (
    (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin'))
    AND marked_by = auth.uid()
  );
CREATE POLICY "Teachers admins update attendance" ON public.attendance
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin')
  );
CREATE POLICY "Teachers admins delete attendance" ON public.attendance
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin')
  );

-- =========================================
-- ACTIVITY LOGS (admin actions)
-- =========================================
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_logs_created ON public.activity_logs(created_at DESC);

GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view logs" ON public.activity_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Authenticated insert own logs" ON public.activity_logs
  FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());
