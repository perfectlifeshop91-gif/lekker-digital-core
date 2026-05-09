import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Minus, Trash2, Receipt, Printer, ShoppingCart, ArrowLeft, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getProductImage } from "@/lib/product-images";
import logo from "@/assets/lekker-logo.jpg";

export const Route = createFileRoute("/pos")({
  component: POSPage,
  head: () => ({ meta: [{ title: "LEKKER · Caisse / POS" }] }),
});

type Product = { id: string; name: string; category: string; price: number; image: string | null; active: boolean };
type CartItem = { product: Product; qty: number };

const TAX_RATE = 0; // adjust if needed

const CATS = [
  { id: "all", label: "Tout" },
  { id: "crepes", label: "Crêpes" },
  { id: "juices", label: "Jus" },
  { id: "mojitos", label: "Mojitos" },
  { id: "icecream", label: "Glaces" },
];

function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("all");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payment, setPayment] = useState("cash");
  const [tableNumber, setTableNumber] = useState("");
  const [customer, setCustomer] = useState("");
  const [notes, setNotes] = useState("");
  const [ticket, setTicket] = useState<null | {
    number: number; items: CartItem[]; subtotal: number; tax: number; total: number;
    payment: string; tableNumber: string; customer: string; notes: string; date: Date;
  }>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("products").select("*").eq("active", true).order("category");
      if (error) toast.error("Erreur chargement produits");
      setProducts((data as Product[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(
    () => products.filter(p =>
      (cat === "all" || p.category === cat) &&
      (!search || p.name.toLowerCase().includes(search.toLowerCase()))
    ),
    [products, cat, search]
  );

  const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
  const tax = +(subtotal * TAX_RATE).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);

  const addToCart = (p: Product) => {
    setCart(prev => {
      const found = prev.find(i => i.product.id === p.id);
      if (found) return prev.map(i => i.product.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product: p, qty: 1 }];
    });
  };
  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.flatMap(i => {
      if (i.product.id !== id) return [i];
      const q = i.qty + delta;
      return q <= 0 ? [] : [{ ...i, qty: q }];
    }));
  };
  const removeItem = (id: string) => setCart(prev => prev.filter(i => i.product.id !== id));
  const clearCart = () => { setCart([]); setTableNumber(""); setCustomer(""); setNotes(""); };

  const checkout = async () => {
    if (cart.length === 0) return toast.error("Panier vide");
    const { data: order, error } = await supabase.from("orders").insert({
      subtotal, tax, total,
      payment_method: payment,
      table_number: tableNumber || null,
      customer_name: customer || null,
      notes: notes || null,
    }).select().single();
    if (error || !order) return toast.error("Erreur commande");
    const items = cart.map(i => ({
      order_id: order.id,
      product_id: i.product.id,
      name: i.product.name,
      price: i.product.price,
      quantity: i.qty,
      subtotal: +(i.product.price * i.qty).toFixed(2),
    }));
    const { error: itemsErr } = await supabase.from("order_items").insert(items);
    if (itemsErr) return toast.error("Erreur articles");
    toast.success(`Commande #${order.order_number} enregistrée`);
    setTicket({
      number: order.order_number, items: cart, subtotal, tax, total,
      payment, tableNumber, customer, notes, date: new Date(order.created_at),
    });
    clearCart();
  };

  const printTicket = () => {
    if (!printRef.current) return;
    const w = window.open("", "_blank", "width=380,height=600");
    if (!w) return;
    w.document.write(`<html><head><title>Ticket</title>
      <style>
        body{font-family:'Courier New',monospace;padding:12px;color:#000;}
        h1,h2,h3{margin:4px 0;text-align:center;}
        .row{display:flex;justify-content:space-between;font-size:13px;}
        .sep{border-top:1px dashed #000;margin:8px 0;}
        .tot{font-weight:bold;font-size:16px;}
        .ctr{text-align:center;font-size:12px;}
      </style></head><body>${printRef.current.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
    setTimeout(() => w.close(), 500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="rounded-md p-2 hover:bg-muted"><ArrowLeft className="h-4 w-4" /></Link>
            <img src={logo} alt="LEKKER" className="h-9 w-9 rounded-full object-cover" />
            <div>
              <div className="font-serif text-lg font-semibold">LEKKER · Caisse</div>
              <div className="text-xs text-muted-foreground">Point of Sale</div>
            </div>
          </div>
          <Link to="/orders"><Button variant="outline" size="sm"><History className="mr-2 h-4 w-4" />Historique</Button></Link>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[1fr_400px]">
        {/* Products */}
        <section>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Input placeholder="Rechercher un produit…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
            <div className="flex flex-wrap gap-1">
              {CATS.map(c => (
                <Button key={c.id} variant={cat === c.id ? "default" : "outline"} size="sm" onClick={() => setCat(c.id)}>
                  {c.label}
                </Button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="py-20 text-center text-muted-foreground">Chargement…</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {filtered.map(p => (
                <button key={p.id} onClick={() => addToCart(p)}
                  className="group overflow-hidden rounded-xl border border-border bg-card text-left shadow-sm transition hover:shadow-lg hover:-translate-y-0.5">
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img src={getProductImage(p.name, p.category)} alt={p.name}
                      className="h-full w-full object-cover transition group-hover:scale-105" />
                  </div>
                  <div className="p-2.5">
                    <div className="line-clamp-1 text-sm font-medium">{p.name}</div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">{p.category}</span>
                      <span className="font-semibold text-primary">{p.price} DH</span>
                    </div>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground">Aucun produit</div>
              )}
            </div>
          )}
        </section>

        {/* Cart */}
        <aside className="sticky top-20 h-fit rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
              <ShoppingCart className="h-5 w-5" /> Panier
            </h2>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart}><Trash2 className="h-4 w-4" /></Button>
            )}
          </div>
          <div className="max-h-[40vh] space-y-2 overflow-auto">
            {cart.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">Cliquez sur un produit pour l'ajouter</div>
            )}
            {cart.map(i => (
              <div key={i.product.id} className="flex items-center gap-2 rounded-lg border border-border p-2">
                <img src={getProductImage(i.product.name, i.product.category)} className="h-12 w-12 rounded object-cover" alt="" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{i.product.name}</div>
                  <div className="text-xs text-muted-foreground">{i.product.price} DH</div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(i.product.id, -1)}><Minus className="h-3 w-3" /></Button>
                  <span className="w-6 text-center text-sm font-medium">{i.qty}</span>
                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(i.product.id, 1)}><Plus className="h-3 w-3" /></Button>
                </div>
                <button onClick={() => removeItem(i.product.id)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2 border-t border-border pt-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Table</Label>
                <Input value={tableNumber} onChange={e => setTableNumber(e.target.value)} placeholder="N°" />
              </div>
              <div>
                <Label className="text-xs">Client</Label>
                <Input value={customer} onChange={e => setCustomer(e.target.value)} placeholder="Nom" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Paiement</Label>
              <Select value={payment} onValueChange={setPayment}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Espèces</SelectItem>
                  <SelectItem value="card">Carte</SelectItem>
                  <SelectItem value="transfer">Virement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Allergies, à emporter…" />
            </div>
          </div>

          <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Sous-total</span><span>{subtotal.toFixed(2)} DH</span></div>
            {TAX_RATE > 0 && <div className="flex justify-between"><span className="text-muted-foreground">TVA</span><span>{tax.toFixed(2)} DH</span></div>}
            <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-primary">{total.toFixed(2)} DH</span></div>
          </div>

          <Button onClick={checkout} className="mt-3 w-full" size="lg" disabled={cart.length === 0}>
            <Receipt className="mr-2 h-4 w-4" /> Encaisser & Imprimer
          </Button>
        </aside>
      </div>

      {/* Ticket Dialog */}
      <Dialog open={!!ticket} onOpenChange={o => !o && setTicket(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ticket de caisse</DialogTitle>
          </DialogHeader>
          {ticket && (
            <div ref={printRef}>
              <h2>LEKKER</h2>
              <div className="ctr">Al Hoceima · Morocco</div>
              <div className="ctr">Un goût ♡ bonheur</div>
              <div className="sep" />
              <div className="row"><span>Ticket #</span><span>{ticket.number}</span></div>
              <div className="row"><span>Date</span><span>{ticket.date.toLocaleString()}</span></div>
              {ticket.tableNumber && <div className="row"><span>Table</span><span>{ticket.tableNumber}</span></div>}
              {ticket.customer && <div className="row"><span>Client</span><span>{ticket.customer}</span></div>}
              <div className="sep" />
              {ticket.items.map(i => (
                <div key={i.product.id}>
                  <div className="row"><span>{i.product.name}</span><span>{(i.product.price * i.qty).toFixed(2)}</span></div>
                  <div className="row" style={{ color: "#666" }}>
                    <span>  {i.qty} × {i.product.price} DH</span><span></span>
                  </div>
                </div>
              ))}
              <div className="sep" />
              <div className="row"><span>Sous-total</span><span>{ticket.subtotal.toFixed(2)} DH</span></div>
              {ticket.tax > 0 && <div className="row"><span>TVA</span><span>{ticket.tax.toFixed(2)} DH</span></div>}
              <div className="row tot"><span>TOTAL</span><span>{ticket.total.toFixed(2)} DH</span></div>
              <div className="row"><span>Paiement</span><span>{ticket.payment}</span></div>
              {ticket.notes && <><div className="sep" /><div style={{ fontSize: 12 }}>Notes: {ticket.notes}</div></>}
              <div className="sep" />
              <div className="ctr">Merci & à bientôt 🤍</div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setTicket(null)}>Fermer</Button>
            <Button onClick={printTicket}><Printer className="mr-2 h-4 w-4" /> Imprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
