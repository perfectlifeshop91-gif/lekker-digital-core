import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Role = "admin" | "waiter" | "kitchen" | "cashier";
export type RoutePath = "/admin" | "/admin/products" | "/admin/analytics" | "/pos" | "/orders" | "/kitchen" | "/waiter" | "/cashier";

// Which roles can access which routes. admin = full access.
export const ACCESS: Record<RoutePath, Role[]> = {
  "/admin": ["admin"],
  "/admin/products": ["admin"],
  "/admin/analytics": ["admin"],
  "/pos": ["admin", "waiter", "cashier"],
  "/orders": ["admin", "cashier"],
  "/kitchen": ["admin", "kitchen"],
  "/waiter": ["admin", "waiter"],
  "/cashier": ["admin", "cashier"],
};

// Where to send a user who landed on a page they can't view.
export function homeForRoles(roles: Role[]): RoutePath {
  if (roles.includes("admin")) return "/admin";
  if (roles.includes("kitchen")) return "/kitchen";
  if (roles.includes("cashier")) return "/cashier";
  if (roles.includes("waiter")) return "/waiter";
  return "/pos";
}

export function canAccess(roles: Role[], path: RoutePath): boolean {
  if (roles.includes("admin")) return true;
  return ACCESS[path].some(r => roles.includes(r));
}

export type RoleState = {
  loading: boolean;
  authed: boolean;
  userId: string | null;
  email: string | null;
  fullName: string | null;
  roles: Role[];
  isAdmin: boolean;
};

export function useRoles(): RoleState {
  const [s, setS] = useState<RoleState>({
    loading: true, authed: false, userId: null, email: null, fullName: null, roles: [], isAdmin: false,
  });
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!data.session) {
        setS({ loading: false, authed: false, userId: null, email: null, fullName: null, roles: [], isAdmin: false });
        return;
      }
      const uid = data.session.user.id;
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", uid),
        supabase.from("profiles").select("full_name").eq("id", uid).maybeSingle(),
      ]);
      const list = ((roles ?? []).map(r => r.role) as Role[]);
      setS({
        loading: false, authed: true, userId: uid,
        email: data.session.user.email ?? null,
        fullName: profile?.full_name ?? null,
        roles: list, isAdmin: list.includes("admin"),
      });
    })();
    return () => { mounted = false; };
  }, []);
  return s;
}

/**
 * Guards a page. Redirects unauthenticated users to /auth and
 * users without permission back to their own home dashboard.
 * Returns the role state for use in the page.
 */
export function useRouteGuard(path: RoutePath): RoleState {
  const state = useRoles();
  const nav = useNavigate();
  useEffect(() => {
    if (state.loading) return;
    if (!state.authed) { nav({ to: "/auth" }); return; }
    if (!canAccess(state.roles, path)) {
      toast.error("Accès refusé · vous n'avez pas les droits pour cette page");
      nav({ to: homeForRoles(state.roles) as any });
    }
  }, [state.loading, state.authed, state.roles.join(","), path, nav]);
  return state;
}
