
-- 1. Orders: restrict to authenticated staff/users
DROP POLICY IF EXISTS "public read orders" ON public.orders;
DROP POLICY IF EXISTS "public insert orders" ON public.orders;

CREATE POLICY "staff read orders" ON public.orders
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'kitchen'::public.app_role)
    OR public.has_role(auth.uid(), 'cashier'::public.app_role)
    OR public.has_role(auth.uid(), 'waiter'::public.app_role)
  );

CREATE POLICY "auth insert orders" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Order items: restrict similarly
DROP POLICY IF EXISTS "public read order_items" ON public.order_items;
DROP POLICY IF EXISTS "public insert order_items" ON public.order_items;

CREATE POLICY "staff read order_items" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'kitchen'::public.app_role)
    OR public.has_role(auth.uid(), 'cashier'::public.app_role)
    OR public.has_role(auth.uid(), 'waiter'::public.app_role)
  );

CREATE POLICY "auth insert order_items" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Audit logs: remove client insert; only admins (server jobs use service_role which bypasses RLS)
DROP POLICY IF EXISTS "auth insert audit" ON public.audit_logs;

CREATE POLICY "admins insert audit" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 4. Realtime: restrict channel subscriptions to authenticated users
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated can read realtime" ON realtime.messages;
CREATE POLICY "authenticated can read realtime" ON realtime.messages
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- 5. Storage: stop public LIST on product-images bucket (direct URLs still work since bucket is public)
DROP POLICY IF EXISTS "public read product images" ON storage.objects;

-- 6. Revoke EXECUTE on SECURITY DEFINER helpers from public roles.
-- RLS still evaluates has_role correctly because policy execution uses the table owner.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_admin_on_signup() FROM PUBLIC, anon, authenticated;
