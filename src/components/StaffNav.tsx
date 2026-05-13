import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ShoppingCart, History, ChefHat, Users, Wallet, Package, BarChart3, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { canAccess, useRoles, type RoutePath, type Role } from "@/lib/roles";
import logo from "@/assets/lekker-logo.jpg";
import { toast } from "sonner";

type Item = { to: RoutePath; label: string; icon: React.ComponentType<{ className?: string }> };

const ALL: Item[] = [
  { to: "/admin", label: "Admin", icon: LayoutDashboard },
  { to: "/pos", label: "POS", icon: ShoppingCart },
  { to: "/kitchen", label: "Cuisine", icon: ChefHat },
  { to: "/waiter", label: "Serveur", icon: Users },
  { to: "/cashier", label: "Caisse", icon: Wallet },
  { to: "/orders", label: "Commandes", icon: History },
  { to: "/admin/products", label: "Produits", icon: Package },
  { to: "/admin/analytics", label: "Stats", icon: BarChart3 },
];

function roleLabel(roles: Role[]) {
  if (roles.includes("admin")) return "Admin";
  if (roles.includes("kitchen")) return "Cuisinier";
  if (roles.includes("cashier")) return "Caissier";
  if (roles.includes("waiter")) return "Serveur";
  return "Staff";
}

export function StaffNav({ title }: { title?: string }) {
  const nav = useNavigate();
  const { roles, fullName, email } = useRoles();
  const path = useRouterState({ select: s => s.location.pathname });
  const visible = ALL.filter(i => canAccess(roles, i.to));

  const logout = async () => {
    await supabase.auth.signOut();
    toast.success("Déconnecté");
    nav({ to: "/auth" });
  };

  return (
    <>
      {/* Desktop / tablet top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
          <Link to="/admin" className="flex items-center gap-2 shrink-0">
            <img src={logo} alt="LEKKER" className="h-9 w-9 rounded-full object-cover" />
            <div className="hidden sm:block leading-tight">
              <div className="font-serif text-base font-semibold tracking-wide">LEKKER</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{title ?? roleLabel(roles)}</div>
            </div>
          </Link>

          <nav className="ml-2 hidden md:flex items-center gap-1 overflow-x-auto">
            {visible.map(i => {
              const active = path === i.to || (i.to !== "/admin" && path.startsWith(i.to));
              return (
                <Link
                  key={i.to}
                  to={i.to}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition ${
                    active ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <i.icon className="h-4 w-4" />
                  {i.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden lg:inline text-xs text-muted-foreground truncate max-w-[160px]">{fullName ?? email}</span>
            <LanguageSwitcher />
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Sortir</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden">
        <div className="grid grid-flow-col auto-cols-fr">
          {visible.slice(0, 5).map(i => {
            const active = path === i.to || (i.to !== "/admin" && path.startsWith(i.to));
            return (
              <Link
                key={i.to}
                to={i.to}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <i.icon className={`h-5 w-5 ${active ? "scale-110" : ""}`} />
                {i.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer so mobile content isn't covered by bottom bar */}
      <div aria-hidden className="h-14 md:hidden" />
    </>
  );
}
