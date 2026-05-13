import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Receipt, ShoppingCart, TrendingUp, Eye, Printer, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { printCustomerReceipt, printKitchenTicket, type ReceiptData } from "@/lib/printing";
import { toast } from "sonner";
import logo from "@/assets/lekker-logo.jpg";
import { StaffNav } from "@/components/StaffNav";
import { useRouteGuard } from "@/lib/roles";

export const Route = createFileRoute("/orders")({
  component: OrdersPage,
  head: () => ({ meta: [{ title: "LEKKER · Historique des commandes" }] }),
});

type Order = {
  id: string; order_number: number; subtotal: number; tax: number; discount: number; total: number;
  payment_method: string; status: string; table_number: string | null;
  customer_name: string | null; notes: string | null; created_at: string; deleted_at: string | null;
};
type Item = { id: string; name: string; price: number; quantity: number; subtotal: number; notes: string | null };

function OrdersPage() {
  const guard = useRouteGuard("/orders");
  const isAdmin = guard.isAdmin;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [items, setItems] = useState<Item[]>([]);

  const reload = async () => {
    setLoading(true);
    const { data } = await supabase.from("orders").select("*").is("deleted_at", null)
      .order("created_at", { ascending: false }).limit(300);
    setOrders((data as Order[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { reload(); }, []);

  const openOrder = async (o: Order) => {
    setSelected(o);
    const { data } = await supabase.from("order_items").select("*").eq("order_id", o.id);
    setItems((data as Item[]) ?? []);
  };

  const buildReceipt = (o: Order, list: Item[]): ReceiptData => ({
    orderNumber: o.order_number,
    items: list.map(i => ({ name: i.name, qty: i.quantity, price: Number(i.price), notes: i.notes })),
    subtotal: Number(o.subtotal), tax: Number(o.tax), discount: Number(o.discount), total: Number(o.total),
    payment: o.payment_method,
    tableNumber: o.table_number ?? undefined,
    customer: o.customer_name ?? undefined,
    notes: o.notes ?? undefined,
    date: new Date(o.created_at),
    logoUrl: window.location.origin + logo,
  });

  const cancelOrder = async (o: Order) => {
    if (!confirm(`Annuler la commande #${o.order_number} ?`)) return;
    const { error } = await supabase.from("orders").update({ deleted_at: new Date().toISOString(), status: "canceled" }).eq("id", o.id);
    if (error) return toast.error(error.message);
    toast.success("Commande annulée");
    setSelected(null);
    reload();
  };

  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString());
  const todayRevenue = todayOrders.reduce((s, o) => s + Number(o.total), 0);

  return (
    <div className="min-h-screen bg-background">
      <StaffNav title="Historique des commandes" />

      <div className="mx-auto max-w-6xl space-y-4 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard icon={ShoppingCart} label="Commandes aujourd'hui" value={todayOrders.length} />
          <StatCard icon={TrendingUp} label="CA aujourd'hui" value={`${todayRevenue.toFixed(2)} DH`} accent />
          <StatCard icon={Receipt} label="Total commandes" value={orders.length} />
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">N°</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 hidden md:table-cell">Table</th>
                <th className="px-4 py-3 hidden md:table-cell">Client</th>
                <th className="px-4 py-3 hidden sm:table-cell">Paiement</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Chargement…</td></tr>}
              {!loading && orders.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Aucune commande</td></tr>}
              {orders.map(o => (
                <tr key={o.id} className="border-t border-border hover:bg-muted/30 cursor-pointer" onClick={() => openOrder(o)}>
                  <td className="px-4 py-3 font-mono font-semibold">#{o.order_number}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(o.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 hidden md:table-cell">{o.table_number || "—"}</td>
                  <td className="px-4 py-3 hidden md:table-cell">{o.customer_name || "—"}</td>
                  <td className="px-4 py-3 capitalize hidden sm:table-cell">{o.payment_method}</td>
                  <td className="px-4 py-3 text-right font-semibold text-primary">{Number(o.total).toFixed(2)} DH</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openOrder(o); }}><Eye className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Commande #{selected?.order_number}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm max-h-[60vh] overflow-auto">
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
                    <div>
                      <div>{i.quantity} × {i.name}</div>
                      {i.notes && <div className="text-xs italic text-primary">★ {i.notes}</div>}
                    </div>
                    <div className="font-medium">{Number(i.subtotal).toFixed(2)} DH</div>
                  </div>
                ))}
              </div>
              {selected.notes && <div className="rounded-md bg-muted p-2 text-xs">📝 {selected.notes}</div>}
              <div className="space-y-1 border-t border-border pt-2">
                <div className="flex justify-between text-xs"><span>Sous-total</span><span>{Number(selected.subtotal).toFixed(2)} DH</span></div>
                {Number(selected.discount) > 0 && <div className="flex justify-between text-xs text-destructive"><span>Remise</span><span>-{Number(selected.discount).toFixed(2)} DH</span></div>}
                <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-primary">{Number(selected.total).toFixed(2)} DH</span></div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {selected && isAdmin && (
              <Button variant="destructive" size="sm" onClick={() => cancelOrder(selected)} className="sm:mr-auto">
                <X className="mr-2 h-4 w-4" />Annuler commande
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => selected && printKitchenTicket(buildReceipt(selected, items))}>
              <Printer className="mr-2 h-4 w-4" />Ticket Cuisine
            </Button>
            <Button size="sm" onClick={() => selected && printCustomerReceipt(buildReceipt(selected, items))}>
              <Printer className="mr-2 h-4 w-4" />Ticket Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: any; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="h-4 w-4" />{label}</div>
      <div className={`mt-1 text-3xl font-bold ${accent ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}
