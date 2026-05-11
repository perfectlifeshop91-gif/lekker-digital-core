import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChefHat, Clock, ArrowLeft, LogOut, Bell } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/lekker-logo.jpg";

export const Route = createFileRoute("/kitchen")({
  component: KitchenPage,
  head: () => ({ meta: [{ title: "LEKKER · Cuisine en temps réel" }] }),
});

type Order = {
  id: string; order_number: number; status: string; table_number: string | null;
  customer_name: string | null; notes: string | null; created_at: string; waiter_id: string | null;
};
type Item = { id: string; order_id: string; name: string; quantity: number; notes: string | null };

const COLS: { status: string; label: string; color: string }[] = [
  { status: "pending", label: "🕐 En attente", color: "from-amber-500/20 to-amber-700/5 border-amber-500/40" },
  { status: "preparing", label: "👨‍🍳 En préparation", color: "from-blue-500/20 to-blue-700/5 border-blue-500/40" },
  { status: "ready", label: "✅ Prêt à servir", color: "from-emerald-500/20 to-emerald-700/5 border-emerald-500/40" },
];

const NEXT: Record<string, string> = { pending: "preparing", preparing: "ready", ready: "delivered" };

function KitchenPage() {
  const nav = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<Record<string, Item[]>>({});
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (!data.session) nav({ to: "/auth" }); });
  }, [nav]);

  useEffect(() => {
    const load = async () => {
      const { data: o } = await supabase.from("orders")
        .select("*").is("deleted_at", null)
        .in("status", ["pending", "preparing", "ready", "paid"])
        .order("created_at", { ascending: true }).limit(80);
      const list = (o as Order[] ?? []).map(x => ({ ...x, status: x.status === "paid" ? "pending" : x.status }));
      setOrders(list);
      const ids = list.map(x => x.id);
      if (ids.length) {
        const { data: it } = await supabase.from("order_items").select("*").in("order_id", ids);
        const grouped: Record<string, Item[]> = {};
        (it as Item[] ?? []).forEach(i => { (grouped[i.order_id] ??= []).push(i); });
        setItems(grouped);
      }
    };
    load();

    const ch = supabase.channel("kitchen-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, () => {
        toast.success("🔔 Nouvelle commande !");
        try { new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=").play().catch(() => {}); } catch {}
      })
      .subscribe();

    const tick = setInterval(() => setNow(Date.now()), 30_000);
    return () => { supabase.removeChannel(ch); clearInterval(tick); };
  }, []);

  const advance = async (o: Order) => {
    const next = NEXT[o.status === "paid" ? "pending" : o.status];
    if (!next) return;
    const { error } = await supabase.from("orders").update({ status: next }).eq("id", o.id);
    if (error) return toast.error(error.message);
    toast.success(`Commande #${o.order_number} → ${next}`);
  };

  const elapsed = (iso: string) => {
    const m = Math.floor((now - new Date(iso).getTime()) / 60000);
    return m < 1 ? "à l'instant" : `${m} min`;
  };

  const logout = async () => { await supabase.auth.signOut(); nav({ to: "/auth" }); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="rounded-md p-2 hover:bg-muted"><ArrowLeft className="h-4 w-4" /></Link>
            <img src={logo} alt="LEKKER" className="h-9 w-9 rounded-full object-cover" />
            <div>
              <div className="font-serif text-lg font-semibold flex items-center gap-2"><ChefHat className="h-5 w-5" />Cuisine · Live</div>
              <div className="text-xs text-muted-foreground">{orders.length} commande(s) actives</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-emerald-500 animate-pulse" />
            <Button variant="outline" size="sm" onClick={logout}><LogOut className="mr-2 h-4 w-4" />Sortir</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {COLS.map(col => {
            const colOrders = orders.filter(o => (o.status === "paid" ? "pending" : o.status) === col.status);
            return (
              <div key={col.status} className={`rounded-2xl border bg-gradient-to-br ${col.color} p-3 min-h-[60vh]`}>
                <h2 className="mb-3 px-2 font-serif text-lg font-semibold">{col.label} <span className="text-sm text-muted-foreground">({colOrders.length})</span></h2>
                <div className="space-y-3">
                  {colOrders.map(o => (
                    <button key={o.id} onClick={() => advance(o)}
                      className="w-full rounded-xl border border-border bg-card p-3 text-left shadow-sm transition hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]">
                      <div className="flex items-baseline justify-between">
                        <div className="font-mono text-2xl font-bold">#{o.order_number}</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" /> {elapsed(o.created_at)}
                        </div>
                      </div>
                      <div className="mt-1 text-sm font-semibold">
                        {o.table_number ? `Table ${o.table_number}` : "À emporter"}
                        {o.customer_name && <span className="ml-2 text-xs text-muted-foreground">· {o.customer_name}</span>}
                      </div>
                      <div className="mt-2 space-y-1">
                        {(items[o.id] ?? []).map(i => (
                          <div key={i.id} className="text-sm">
                            <span className="inline-block min-w-[28px] rounded border border-border bg-background px-1.5 py-0.5 text-center font-bold">{i.quantity}</span>
                            <span className="ml-2">{i.name}</span>
                            {i.notes && <div className="ml-9 text-xs italic text-amber-600">★ {i.notes}</div>}
                          </div>
                        ))}
                      </div>
                      {o.notes && <div className="mt-2 rounded bg-amber-500/10 p-1.5 text-xs italic">⚠ {o.notes}</div>}
                      <div className="mt-3 text-center text-xs font-medium text-primary">
                        Tap pour passer à : <strong>{NEXT[o.status === "paid" ? "pending" : o.status]}</strong>
                      </div>
                    </button>
                  ))}
                  {colOrders.length === 0 && (
                    <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                      Aucune commande
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
