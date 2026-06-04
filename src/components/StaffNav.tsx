import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ShoppingCart, History, ChefHat, Users, Wallet, Package, BarChart3, LogOut, Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { canAccess, useRoles, type RoutePath, type Role } from "@/lib/roles";
import logo from "@/assets/lekker-logo.jpg";
import { toast } from "sonner";

const IDLE_MS = 30 * 60 * 1000; // 30 min auto-logout

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
  const [open, setOpen] = useState(false);

  const logout = async (reason?: string) => {
    await supabase.auth.signOut();
    toast.success(reason ?? "Déconnecté");
    nav({ to: "/auth" });
  };

  // Auto-logout after inactivity
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const reset = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => logout("Session expirée · déconnecté"), IDLE_MS);
    };
    const events = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      events.forEach(e => window.removeEventListener(e, reset));
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close mobile sheet whenever route changes
  useEffect(() => { setOpen(false); }, [path]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
        {/* Mobile menu trigger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="border-b border-border px-4 py-3">
              <SheetTitle className="flex items-center gap-2">
                <img src={logo} alt="LEKKER" className="h-8 w-8 rounded-full object-cover" />
                <div className="leading-tight text-left">
                  <div className="font-serif text-base">LEKKER</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{title ?? roleLabel(roles)}</div>
                </div>
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 p-3">
              {visible.map(i => {
                const active = path === i.to || (i.to !== "/admin" && path.startsWith(i.to));
                return (
                  <Link
                    key={i.to}
                    to={i.to}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                      active ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
                    }`}
                  >
                    <i.icon className="h-4 w-4" />
                    {i.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-border px-3 py-3 mt-auto">
              <div className="mb-2 truncate text-xs text-muted-foreground">{fullName ?? email}</div>
              <Button variant="outline" size="sm" className="w-full" onClick={() => logout()}>
                <LogOut className="mr-2 h-4 w-4" /> Sortir
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        <Link to="/admin" className="flex items-center gap-2 shrink-0">
          <img src={logo} alt="LEKKER" className="h-9 w-9 rounded-full object-cover" />
          <div className="hidden sm:block leading-tight">
            <div className="font-serif text-base font-semibold tracking-wide">LEKKER</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{title ?? roleLabel(roles)}</div>
          </div>
        </Link>

        {/* Desktop nav */}
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
          <Button variant="outline" size="sm" className="hidden md:inline-flex" onClick={() => logout()}>
            <LogOut className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Sortir</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
