import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingCart, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { StaffNav } from "@/components/StaffNav";
import { useRouteGuard } from "@/lib/roles";

export const Route = createFileRoute("/waiter")({
  component: WaiterPage,
  head: () => ({ meta: [{ title: "LEKKER · Espace Serveur" }] }),
});

type Order = {
  id: string; order_number: number; status: string; total: number; tip: number;
  table_number: string | null; customer_name: string | null; created_at: string; waiter_id: string | null;
};

function WaiterPage() {
  const guard = useRouteGuard("/waiter");
  const userId = guard.userId;
  const name = guard.fullName ?? guard.email ?? "Serveur";
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const { data } = await supabase.from("orders").select("*")
        .or(`waiter_id.eq.${userId},waiter_id.is.null`)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }).limit(50);
      setOrders((data as Order[]) ?? []);
    };
    load();
    const ch = supabase.channel("waiter-orders").on("postgres_changes",
      { event: "*", schema: "public", table: "orders" }, () => load()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId]);

  const today = new Date().toDateString();
  const todayAll = orders.filter(o => new Date(o.created_at).toDateString() === today);
  void orders.length;
  const todayMine = todayAll.filter(o => o.waiter_id === userId || o.waiter_id === null);
  const active = orders.filter(o => ["pending", "preparing", "ready"].includes(o.status));
  const ready = orders.filter(o => o.status === "ready");
  const revenue = todayMine.reduce((s, o) => s + Number(o.total), 0);
  const tips = todayMine.reduce((s, o) => s + Number(o.tip ?? 0), 0);

  const markDelivered = async (o: Order) => {
    const { error } = await supabase.from("orders").update({ status: "delivered" }).eq("id", o.id);
    if (error) toast.error(error.message); else toast.success(`#${o.order_number} servi ✓`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <StaffNav title={`Serveur · ${name}`} />

      <main className="mx-auto max-w-6xl space-y-5 p-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Actives" value={active.length} icon={Clock} />
          <Stat label="Aujourd'hui" value={todayMine.length} icon={ShoppingCart} />
          <Stat label="CA généré" value={`${revenue.toFixed(0)} DH`} icon={TrendingUp} />
          <Stat label="Pourboires" value={`${tips.toFixed(0)} DH`} icon={CheckCircle} />
        </div>

        <Link to="/pos" className="block">
          <Button size="lg" className="w-full"><Plus className="mr-2 h-5 w-5" />Nouvelle commande</Button>
        </Link>

        {ready.length > 0 && (
          <section className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 p-4">
            <h2 className="mb-3 font-serif text-lg font-semibold text-emerald-600">🔔 Prêt à servir ({ready.length})</h2>
            <div className="grid gap-2 md:grid-cols-2">
              {ready.map(o => (
                <div key={o.id} className="flex items-center justify-between rounded-lg bg-card p-3 shadow-sm">
                  <div>
                    <div className="font-mono font-bold">#{o.order_number}</div>
                    <div className="text-sm text-muted-foreground">{o.table_number ? `Table ${o.table_number}` : "À emporter"} · {o.customer_name ?? ""}</div>
                  </div>
                  <Button size="sm" onClick={() => markDelivered(o)}>Servi</Button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-3 font-serif text-lg font-semibold">Mes commandes récentes</h2>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr><th className="px-3 py-2 text-left">N°</th><th className="px-3 py-2 text-left">Table</th><th className="px-3 py-2 text-left">Statut</th><th className="px-3 py-2 text-right">Total</th></tr>
              </thead>
              <tbody>
                {todayMine.length === 0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">Aucune commande aujourd'hui</td></tr>}
                {todayMine.map(o => (
                  <tr key={o.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-3 py-2 font-mono font-semibold">#{o.order_number}</td>
                    <td className="px-3 py-2">{o.table_number || "—"}</td>
                    <td className="px-3 py-2"><StatusBadge status={o.status} /></td>
                    <td className="px-3 py-2 text-right font-semibold">{Number(o.total).toFixed(2)} DH</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Icon className="h-4 w-4" />{label}</div>
      <div className="mt-1 font-serif text-2xl font-bold">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-500/20 text-amber-700",
    preparing: "bg-blue-500/20 text-blue-700",
    ready: "bg-emerald-500/20 text-emerald-700",
    delivered: "bg-muted text-foreground",
    paid: "bg-muted text-foreground",
    canceled: "bg-destructive/20 text-destructive",
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs ${map[status] ?? "bg-muted"}`}>{status}</span>;
}
