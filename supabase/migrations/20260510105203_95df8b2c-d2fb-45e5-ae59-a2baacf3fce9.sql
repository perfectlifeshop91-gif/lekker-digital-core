
-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'waiter', 'kitchen', 'cashier');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  shift_hours TEXT,
  salary NUMERIC DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profile policies
CREATE POLICY "users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.has_role(auth.uid(),'admin') OR auth.uid() = id);

-- user_roles policies
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- EXTEND PRODUCTS
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS ingredients TEXT,
  ADD COLUMN IF NOT EXISTS allergens TEXT,
  ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 999,
  ADD COLUMN IF NOT EXISTS prep_time INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS calories INTEGER,
  ADD COLUMN IF NOT EXISTS promo_price NUMERIC,
  ADD COLUMN IF NOT EXISTS available BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]'::jsonb;

-- Replace permissive product write policies with admin-only
DROP POLICY IF EXISTS "public write products" ON public.products;
DROP POLICY IF EXISTS "public update products" ON public.products;
DROP POLICY IF EXISTS "public delete products" ON public.products;
CREATE POLICY "admins write products" ON public.products FOR INSERT WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins update products" ON public.products FOR UPDATE USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete products" ON public.products FOR DELETE USING (public.has_role(auth.uid(),'admin'));

-- EXTEND ORDERS
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS waiter_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS discount NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tip NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- order_items notes
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Tighten orders policies
DROP POLICY IF EXISTS "public update orders" ON public.orders;
CREATE POLICY "staff update orders" ON public.orders FOR UPDATE USING (
  public.has_role(auth.uid(),'admin')
  OR public.has_role(auth.uid(),'kitchen')
  OR public.has_role(auth.uid(),'cashier')
  OR (public.has_role(auth.uid(),'waiter') AND waiter_id = auth.uid())
);

-- AUDIT LOGS
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read audit" ON public.audit_logs FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "auth insert audit" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Realtime for orders & order_items & products
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
