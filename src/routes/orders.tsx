import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Receipt, ShoppingCart, TrendingUp, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import logo from "@/assets/lekker-logo.jpg";

export const Route = createFileRoute("/orders")({
  component: OrdersPage,
  head: () => ({ meta: [{ title: "LEKKER · Historique des commandes" }] }),
});

type Order = {
  id: string; order_number: number; subtotal: number; tax: number; total: number;
  payment_method: string; status: string; table_number: string | null;
  customer_name: string | null; notes: string | null; created_at: string;
};
type Item = { id: string; name: string; price: number; quantity: number; subtotal: number };

function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200);
      setOrders((data as Order[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const openOrder = async (o: Order) => {
    setSelected(o);
    const { data } = await supabase.from("order_items").select("*").eq("order_id", o.id);
    setItems((data as Item[]) ?? []);
  };

  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString());
  const todayRevenue = todayOrders.reduce((s, o) => s + Number(o.total), 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/pos" className="rounded-md p-2 hover:bg-muted"><ArrowLeft className="h-4 w-4" /></Link>
            <img src={logo} alt="LEKKER" className="h-9 w-9 rounded-full object-cover" />
            <div className="font-serif text-lg font-semibold">Historique des commandes</div>
          </div>
          <Link to="/pos"><Button size="sm"><Receipt className="mr-2 h-4 w-4" />Caisse</Button></Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-4 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><ShoppingCart className="h-4 w-4" /> Commandes aujourd'hui</div>
            <div className="mt-1 text-3xl font-bold">{todayOrders.length}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="h-4 w-4" /> CA aujourd'hui</div>
            <div className="mt-1 text-3xl font-bold text-primary">{todayRevenue.toFixed(2)} DH</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Receipt className="h-4 w-4" /> Total commandes</div>
            <div className="mt-1 text-3xl font-bold">{orders.length}</div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">N°</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Table</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Paiement</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Chargement…</td></tr>}
              {!loading && orders.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Aucune commande</td></tr>}
              {orders.map(o => (
                <tr key={o.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono font-semibold">#{o.order_number}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(o.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">{o.table_number || "—"}</td>
                  <td className="px-4 py-3">{o.customer_name || "—"}</td>
                  <td className="px-4 py-3 capitalize">{o.payment_method}</td>
                  <td className="px-4 py-3 text-right font-semibold text-primary">{Number(o.total).toFixed(2)} DH</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => openOrder(o)}><Eye className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Commande #{selected?.order_number}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="text-muted-foreground">{new Date(selected.created_at).toLocaleString()}</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Table:</span> {selected.table_number || "—"}</div>
                <div><span className="text-muted-foreground">Client:</span> {selected.customer_name || "—"}</div>
                <div><span className="text-muted-foreground">Paiement:</span> {selected.payment_method}</div>
                <div><span className="text-muted-foreground">Statut:</span> {selected.status}</div>
              </div>
              <div className="rounded-lg border border-border">
                {items.map(i => (
                  <div key={i.id} className="flex justify-between border-b border-border px-3 py-2 last:border-0">
                    <div>{i.quantity} × {i.name}</div>
                    <div className="font-medium">{Number(i.subtotal).toFixed(2)} DH</div>
                  </div>
                ))}
              </div>
              {selected.notes && <div className="rounded-md bg-muted p-2 text-xs">📝 {selected.notes}</div>}
              <div className="flex justify-between border-t border-border pt-2 text-lg font-bold">
                <span>Total</span><span className="text-primary">{Number(selected.total).toFixed(2)} DH</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
