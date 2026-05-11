import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, ShoppingCart, History, LogOut, Users, Package, ChefHat, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AIChatWidget } from "@/components/AIChatWidget";
import logo from "@/assets/lekker-logo.jpg";

export const Route = createFileRoute("/admin")({
  component: AdminHome,
  head: () => ({ meta: [{ title: "LEKKER · Administration" }] }),
});

function AdminHome() {
  const nav = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [stats, setStats] = useState({ ordersToday: 0, revenueToday: 0, products: 0 });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { nav({ to: "/auth" }); return; }
      setEmail(data.session.user.email ?? null);
    });
    (async () => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const [{ data: orders }, { count: prodCount }] = await Promise.all([
        supabase.from("orders").select("total").gte("created_at", start.toISOString()).is("deleted_at", null),
        supabase.from("products").select("*", { count: "exact", head: true }),
      ]);
      const ordersToday = orders?.length ?? 0;
      const revenueToday = orders?.reduce((s, o: any) => s + Number(o.total), 0) ?? 0;
      setStats({ ordersToday, revenueToday, products: prodCount ?? 0 });
    })();
  }, [nav]);

  const logout = async () => { await supabase.auth.signOut(); toast.success("Déconnecté"); nav({ to: "/auth" }); };

  const tiles = [
    { to: "/pos", label: "Caisse / POS", desc: "Encaissement & impression", icon: ShoppingCart, color: "from-amber-500/20 to-amber-700/10" },
    { to: "/kitchen", label: "Cuisine Live", desc: "Écran cuisine temps réel", icon: ChefHat, color: "from-rose-500/20 to-rose-700/10" },
    { to: "/waiter", label: "Espace Serveur", desc: "Tableau de bord serveur", icon: Users, color: "from-purple-500/20 to-purple-700/10" },
    { to: "/orders", label: "Commandes", desc: "Historique & gestion", icon: History, color: "from-blue-500/20 to-blue-700/10" },
    { to: "/admin/products", label: "Produits", desc: "CRUD du menu", icon: Package, color: "from-emerald-500/20 to-emerald-700/10" },
    { to: "/admin/analytics", label: "Analytics", desc: "Stats & graphiques", icon: LayoutDashboard, color: "from-cyan-500/20 to-cyan-700/10" },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/40">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-4 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <img src={logo} alt="LEKKER" className="h-10 w-10 rounded-full object-cover shrink-0" />
            <div className="min-w-0">
              <div className="font-serif text-xl font-semibold tracking-wider">LEKKER</div>
              <div className="text-xs text-muted-foreground truncate">Administration</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <span className="hidden text-sm text-muted-foreground lg:inline">{email}</span>
            <Button variant="outline" size="sm" onClick={logout}><LogOut className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Sortir</span></Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Commandes aujourd'hui" value={stats.ordersToday.toString()} />
          <StatCard label="CA aujourd'hui" value={`${stats.revenueToday.toFixed(2)} DH`} />
          <StatCard label="Produits actifs" value={stats.products.toString()} />
        </div>

        <h2 className="mt-10 mb-4 font-serif text-2xl font-semibold flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Modules</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map(t => (
            <Link key={t.label} to={t.to}
              className={`group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${t.color} p-6 transition hover:shadow-xl hover:-translate-y-0.5`}>
              <t.icon className="mb-4 h-10 w-10 text-foreground/80" />
              <div className="font-serif text-xl font-semibold">{t.label}</div>
              <div className="mt-1 text-sm text-muted-foreground">{t.desc}</div>
            </Link>
          ))}
        </div>
      </main>

      <AIChatWidget />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 font-serif text-3xl font-bold">{value}</div>
    </div>
  );
}
