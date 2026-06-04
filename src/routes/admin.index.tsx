import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, ShoppingCart, History, Users, Package, ChefHat, Sparkles, Wallet } from "lucide-react";
import { StaffNav } from "@/components/StaffNav";
import { useRouteGuard } from "@/lib/roles";

export const Route = createFileRoute("/admin/")({
  component: AdminHome,
  head: () => ({ meta: [{ title: "LEKKER · Administration" }] }),
});

function AdminHome() {
  useRouteGuard("/admin");
  const [stats, setStats] = useState({ ordersToday: 0, revenueToday: 0, products: 0 });

  useEffect(() => {
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
  }, []);

  const tiles = [
    { to: "/pos", label: "Caisse / POS", desc: "Encaissement & impression", icon: ShoppingCart, color: "from-amber-500/20 to-amber-700/10" },
    { to: "/kitchen", label: "Dashboard Cuisinier", desc: "Écran cuisine temps réel", icon: ChefHat, color: "from-rose-500/20 to-rose-700/10" },
    { to: "/waiter", label: "Dashboard Serveur", desc: "Espace serveur & pourboires", icon: Users, color: "from-purple-500/20 to-purple-700/10" },
    { to: "/cashier", label: "Dashboard Caissier", desc: "Encaissement & paiements", icon: Wallet, color: "from-yellow-500/20 to-yellow-700/10" },
    { to: "/orders", label: "Commandes", desc: "Historique & gestion", icon: History, color: "from-blue-500/20 to-blue-700/10" },
    { to: "/admin/products", label: "Produits", desc: "CRUD du menu", icon: Package, color: "from-emerald-500/20 to-emerald-700/10" },
    { to: "/admin/analytics", label: "Analytics", desc: "Stats & graphiques", icon: LayoutDashboard, color: "from-cyan-500/20 to-cyan-700/10" },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/40">
      <StaffNav title="Administration" />

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
