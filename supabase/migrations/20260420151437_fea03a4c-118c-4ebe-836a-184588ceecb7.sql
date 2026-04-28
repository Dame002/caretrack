-- ============== ENUMS ==============
CREATE TYPE public.app_role AS ENUM ('admin', 'medecin', 'infirmier_accueil', 'infirmier_soins');
CREATE TYPE public.triage_level AS ENUM ('rouge', 'orange', 'jaune', 'vert');
CREATE TYPE public.visit_status AS ENUM ('en_attente_triage', 'triage_effectue', 'en_consultation', 'en_soins', 'sortie');
CREATE TYPE public.sex AS ENUM ('M', 'F', 'autre');

-- ============== PROFILES ==============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============== USER ROLES ==============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============== SECURITY FUNCTIONS ==============
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id
  );
$$;

-- ============== PATIENTS ==============
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_number TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birth_date DATE,
  sex sex,
  phone TEXT,
  emergency_contact TEXT,
  medical_history TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- File number generator
CREATE OR REPLACE FUNCTION public.generate_file_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_num INT;
BEGIN
  SELECT COALESCE(MAX(CAST(SPLIT_PART(file_number, '-', 3) AS INT)), 0) + 1
  INTO next_num
  FROM public.patients
  WHERE file_number LIKE 'P-' || EXTRACT(YEAR FROM now()) || '-%';
  RETURN 'P-' || EXTRACT(YEAR FROM now()) || '-' || LPAD(next_num::TEXT, 4, '0');
END;
$$;

-- ============== VISITS ==============
CREATE TABLE public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  triage triage_level,
  status visit_status NOT NULL DEFAULT 'en_attente_triage',
  box TEXT,
  assigned_doctor UUID REFERENCES auth.users(id),
  vitals JSONB,
  arrived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  triaged_at TIMESTAMPTZ,
  consulted_at TIMESTAMPTZ,
  discharged_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
CREATE INDEX visits_status_idx ON public.visits(status);
CREATE INDEX visits_triage_idx ON public.visits(triage);

-- ============== CONSULTATIONS ==============
CREATE TABLE public.consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES auth.users(id),
  diagnosis TEXT,
  prescription TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

-- ============== updated_at trigger ==============
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_patients_updated BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_visits_updated   BEFORE UPDATE ON public.visits   FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============== AUTO PROFILE + FIRST USER = ADMIN ==============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INT;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );

  SELECT COUNT(*) INTO user_count FROM public.profiles;

  IF user_count = 1 THEN
    -- First registered user becomes admin
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============== RLS POLICIES ==============

-- profiles
CREATE POLICY "view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "admins view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- user_roles
CREATE POLICY "view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- patients (any staff)
CREATE POLICY "staff view patients" ON public.patients
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff create patients" ON public.patients
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff update patients" ON public.patients
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "admins delete patients" ON public.patients
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- visits
CREATE POLICY "staff view visits" ON public.visits
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff create visits" ON public.visits
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff update visits" ON public.visits
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "admins delete visits" ON public.visits
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- consultations
CREATE POLICY "staff view consultations" ON public.consultations
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "doctors create consultations" ON public.consultations
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'medecin') OR public.is_admin(auth.uid()));
CREATE POLICY "doctors update own consultations" ON public.consultations
  FOR UPDATE TO authenticated
  USING (doctor_id = auth.uid() OR public.is_admin(auth.uid()));