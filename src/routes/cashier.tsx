import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ShoppingCart, TrendingUp, Receipt, Wallet, CreditCard, Printer, Eye } from "lucide-react";
import logo from "@/assets/lekker-logo.jpg";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { printCustomerReceipt, printKitchenTicket, type ReceiptData } from "@/lib/printing";
import { StaffNav } from "@/components/StaffNav";
import { useRouteGuard } from "@/lib/roles";

export const Route = createFileRoute("/cashier")({
  component: CashierPage,
  head: () => ({ meta: [{ title: "LEKKER · Espace Caissier" }] }),
});

type Order = {
  id: string; order_number: number; status: string; total: number; subtotal: number;
  tax: number; discount: number; payment_method: string; table_number: string | null;
  customer_name: string | null; notes: string | null; created_at: string;
};
type Item = { id: string; name: string; price: number; quantity: number; notes: string | null };

function CashierPage() {
  const guard = useRouteGuard("/cashier");
  const name = guard.fullName ?? guard.email ?? "Caissier";
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("orders").select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false }).limit(100);
      setOrders((data as Order[]) ?? []);
    };
    load();
    const ch = supabase.channel("cashier-orders").on("postgres_changes",
      { event: "*", schema: "public", table: "orders" }, () => load()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const openOrder = async (o: Order) => {
    setSelected(o);
    const { data } = await supabase.from("order_items").select("*").eq("order_id", o.id);
    setItems((data as Item[]) ?? []);
  };

  const reprint = (o: Order, mode: "client" | "kitchen") => {
    const r: ReceiptData = {
      orderNumber: o.order_number,
      items: items.map(i => ({ name: i.name, qty: i.quantity, price: i.price, notes: i.notes ?? undefined })),
      subtotal: o.subtotal, tax: o.tax, discount: o.discount, total: o.total,
      payment: o.payment_method, tableNumber: o.table_number ?? "",
      customer: o.customer_name ?? "", notes: o.notes ?? "",
      date: new Date(o.created_at), logoUrl: window.location.origin + logo,
    };
    if (mode === "client") printCustomerReceipt(r); else printKitchenTicket(r);
  };

  const markPaid = async (o: Order) => {
    const { error } = await supabase.from("orders").update({ status: "paid" }).eq("id", o.id);
    if (error) toast.error(error.message); else toast.success(`#${o.order_number} encaissé`);
  };

  const today = new Date().toDateString();
  const todays = orders.filter(o => new Date(o.created_at).toDateString() === today);
  const revenue = todays.reduce((s, o) => s + Number(o.total), 0);
  const cash = todays.filter(o => o.payment_method === "cash").reduce((s, o) => s + Number(o.total), 0);
  const card = todays.filter(o => o.payment_method === "card").reduce((s, o) => s + Number(o.total), 0);
  const transfer = todays.filter(o => o.payment_method === "transfer").reduce((s, o) => s + Number(o.total), 0);
  const unpaid = orders.filter(o => ["pending", "preparing", "ready", "delivered"].includes(o.status));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <StaffNav title={`Caissier · ${name}`} />

      <main className="mx-auto max-w-6xl space-y-5 p-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Commandes" value={todays.length} icon={ShoppingCart} />
          <Stat label="CA Total" value={`${revenue.toFixed(0)} DH`} icon={TrendingUp} />
          <Stat label="Espèces" value={`${cash.toFixed(0)} DH`} icon={Wallet} />
          <Stat label="Carte/Virement" value={`${(card + transfer).toFixed(0)} DH`} icon={CreditCard} />
        </div>

        {unpaid.length > 0 && (
          <section className="rounded-2xl border-2 border-amber-500/40 bg-amber-500/5 p-4">
            <h2 className="mb-3 font-serif text-lg font-semibold text-amber-600">💰 À encaisser ({unpaid.length})</h2>
            <div className="grid gap-2 md:grid-cols-2">
              {unpaid.slice(0, 6).map(o => (
                <div key={o.id} className="flex items-center justify-between rounded-lg bg-card p-3 shadow-sm">
                  <div>
                    <div className="font-mono font-bold">#{o.order_number} · <span className="text-primary">{Number(o.total).toFixed(2)} DH</span></div>
                    <div className="text-xs text-muted-foreground">{o.table_number ? `Table ${o.table_number}` : "À emporter"} · {o.payment_method}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => openOrder(o)}><Eye className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" onClick={() => markPaid(o)}>Payé</Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-3 font-serif text-lg font-semibold">Toutes les commandes du jour</h2>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">N°</th>
                  <th className="px-3 py-2 text-left">Heure</th>
                  <th className="px-3 py-2 text-left">Table</th>
                  <th className="px-3 py-2 text-left">Paiement</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {todays.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">Aucune commande</td></tr>}
                {todays.map(o => (
                  <tr key={o.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-3 py-2 font-mono font-semibold">#{o.order_number}</td>
                    <td className="px-3 py-2 text-muted-foreground">{new Date(o.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="px-3 py-2">{o.table_number || "—"}</td>
                    <td className="px-3 py-2 capitalize">{o.payment_method}</td>
                    <td className="px-3 py-2 text-right font-semibold">{Number(o.total).toFixed(2)} DH</td>
                    <td className="px-3 py-2 text-right">
                      <Button size="sm" variant="ghost" onClick={() => openOrder(o)}><Eye className="h-3.5 w-3.5" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <Dialog open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Commande #{selected?.order_number}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>{new Date(selected.created_at).toLocaleString()}</span><span className="capitalize">{selected.status}</span></div>
              {selected.table_number && <div>Table : <b>{selected.table_number}</b></div>}
              {selected.customer_name && <div>Client : <b>{selected.customer_name}</b></div>}
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                {items.map(i => (
                  <div key={i.id} className="flex justify-between">
                    <span>{i.quantity} × {i.name}</span><span>{(i.quantity * i.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Sous-total</span><span>{Number(selected.subtotal).toFixed(2)} DH</span></div>
                {Number(selected.discount) > 0 && <div className="flex justify-between text-destructive"><span>Remise</span><span>-{Number(selected.discount).toFixed(2)} DH</span></div>}
                <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-primary">{Number(selected.total).toFixed(2)} DH</span></div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => reprint(selected, "kitchen")}><Printer className="mr-2 h-4 w-4" />Cuisine</Button>
                <Button size="sm" variant="outline" onClick={() => reprint(selected, "client")}><Printer className="mr-2 h-4 w-4" />Reçu Client</Button>
                {selected.status !== "paid" && <Button size="sm" onClick={() => { markPaid(selected); setSelected(null); }}>Marquer Payé</Button>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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
