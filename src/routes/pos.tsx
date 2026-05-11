import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Minus, Trash2, Receipt, Printer, ShoppingCart, ArrowLeft, History, StickyNote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { getProductImage } from "@/lib/product-images";
import { printBoth, printCustomerReceipt, printKitchenTicket, type ReceiptData } from "@/lib/printing";
import { LANGS, type Lang } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import logo from "@/assets/lekker-logo.jpg";

export const Route = createFileRoute("/pos")({
  component: POSPage,
  head: () => ({ meta: [{ title: "LEKKER · Caisse / POS" }] }),
});

type Product = { id: string; name: string; category: string; price: number; image: string | null; active: boolean };
type CartItem = { product: Product; qty: number; notes?: string };

const TAX_RATE = 0;

const CATS = [
  { id: "all", label: "Tout" },
  { id: "crepes", label: "Crêpes" },
  { id: "juices", label: "Jus" },
  { id: "mojitos", label: "Mojitos" },
  { id: "icecream", label: "Glaces" },
  { id: "drinks", label: "Boissons" },
  { id: "desserts", label: "Desserts" },
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
  const [discount, setDiscount] = useState(0);
  const [ticket, setTicket] = useState<ReceiptData | null>(null);
  const printedOnce = useRef(false);

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
  const discountAmt = Math.min(discount, subtotal);
  const tax = +((subtotal - discountAmt) * TAX_RATE).toFixed(2);
  const total = +(subtotal - discountAmt + tax).toFixed(2);

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
  const setItemNotes = (id: string, n: string) =>
    setCart(prev => prev.map(i => i.product.id === id ? { ...i, notes: n } : i));
  const removeItem = (id: string) => setCart(prev => prev.filter(i => i.product.id !== id));
  const clearCart = () => { setCart([]); setTableNumber(""); setCustomer(""); setNotes(""); setDiscount(0); };

  const checkout = async () => {
    if (cart.length === 0) return toast.error("Panier vide");
    const { data: order, error } = await supabase.from("orders").insert({
      subtotal, tax, total,
      discount: discountAmt,
      payment_method: payment,
      table_number: tableNumber || null,
      customer_name: customer || null,
      notes: notes || null,
    }).select().single();
    if (error || !order) return toast.error("Erreur commande: " + (error?.message ?? ""));
    const items = cart.map(i => ({
      order_id: order.id,
      product_id: i.product.id,
      name: i.product.name,
      price: i.product.price,
      quantity: i.qty,
      subtotal: +(i.product.price * i.qty).toFixed(2),
      notes: i.notes || null,
    }));
    const { error: itemsErr } = await supabase.from("order_items").insert(items);
    if (itemsErr) return toast.error("Erreur articles: " + itemsErr.message);
    toast.success(`Commande #${order.order_number} enregistrée`);

    const receipt: ReceiptData = {
      orderNumber: order.order_number,
      items: cart.map(i => ({ name: i.product.name, qty: i.qty, price: i.product.price, notes: i.notes })),
      subtotal, tax, discount: discountAmt, total,
      payment, tableNumber, customer, notes,
      date: new Date(order.created_at),
      logoUrl: window.location.origin + logo,
    };
    setTicket(receipt);
    printedOnce.current = false;
    clearCart();
  };

  // Auto-print both tickets when ticket dialog opens
  useEffect(() => {
    if (ticket && !printedOnce.current) {
      printedOnce.current = true;
      // small delay so dialog renders
      setTimeout(() => printBoth(ticket), 300);
    }
  }, [ticket]);

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
              <div key={i.product.id} className="rounded-lg border border-border p-2">
                <div className="flex items-center gap-2">
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className={`rounded p-1 ${i.notes ? "text-primary" : "text-muted-foreground"} hover:bg-muted`}>
                        <StickyNote className="h-3.5 w-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                      <Label className="text-xs">Note pour la cuisine</Label>
                      <Textarea rows={2} value={i.notes ?? ""} onChange={e => setItemNotes(i.product.id, e.target.value)} placeholder="Sans sucre, extra…" />
                    </PopoverContent>
                  </Popover>
                  <button onClick={() => removeItem(i.product.id)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {i.notes && <div className="mt-1 truncate pl-14 text-xs italic text-primary">★ {i.notes}</div>}
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
            <div className="grid grid-cols-2 gap-2">
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
                <Label className="text-xs">Remise (DH)</Label>
                <Input type="number" min={0} value={discount} onChange={e => setDiscount(+e.target.value || 0)} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Notes générales</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Allergies, à emporter…" />
            </div>
          </div>

          <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Sous-total</span><span>{subtotal.toFixed(2)} DH</span></div>
            {discountAmt > 0 && <div className="flex justify-between text-destructive"><span>Remise</span><span>-{discountAmt.toFixed(2)} DH</span></div>}
            {TAX_RATE > 0 && <div className="flex justify-between"><span className="text-muted-foreground">TVA</span><span>{tax.toFixed(2)} DH</span></div>}
            <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-primary">{total.toFixed(2)} DH</span></div>
          </div>

          <Button onClick={checkout} className="mt-3 w-full" size="lg" disabled={cart.length === 0}>
            <Receipt className="mr-2 h-4 w-4" /> Encaisser & Imprimer
          </Button>
        </aside>
      </div>

      <Dialog open={!!ticket} onOpenChange={o => !o && setTicket(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Commande #{ticket?.orderNumber}</DialogTitle>
          </DialogHeader>
          {ticket && (
            <div className="max-h-[60vh] overflow-auto rounded-lg border border-border bg-muted/30 p-4 text-sm">
              <div className="mb-2 text-center font-serif text-2xl font-bold tracking-widest">LEKKER</div>
              <div className="mb-3 text-center text-xs text-muted-foreground">Al Hoceima · Morocco</div>
              <div className="border-t border-dashed border-border py-2">
                <div className="flex justify-between"><span>Ticket #</span><span className="font-bold">{ticket.orderNumber}</span></div>
                <div className="flex justify-between text-xs text-muted-foreground"><span>{ticket.date.toLocaleString()}</span></div>
                {ticket.tableNumber && <div className="flex justify-between"><span>Table</span><span>{ticket.tableNumber}</span></div>}
                {ticket.customer && <div className="flex justify-between"><span>Client</span><span>{ticket.customer}</span></div>}
              </div>
              <div className="border-t border-dashed border-border py-2">
                {ticket.items.map((i, k) => (
                  <div key={k} className="mb-1">
                    <div className="flex justify-between"><span>{i.qty} × {i.name}</span><span>{(i.qty * i.price).toFixed(2)}</span></div>
                    {i.notes && <div className="pl-4 text-xs italic text-primary">★ {i.notes}</div>}
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-border py-2">
                <div className="flex justify-between"><span>Sous-total</span><span>{ticket.subtotal.toFixed(2)} DH</span></div>
                {ticket.discount && ticket.discount > 0 ? <div className="flex justify-between text-destructive"><span>Remise</span><span>-{ticket.discount.toFixed(2)} DH</span></div> : null}
                <div className="mt-1 flex justify-between text-lg font-bold"><span>TOTAL</span><span>{ticket.total.toFixed(2)} DH</span></div>
              </div>
              <div className="mt-2 text-center text-xs italic">Merci d'avoir choisi LEKKER ❤</div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => ticket && printKitchenTicket(ticket)}><Printer className="mr-2 h-4 w-4" /> Cuisine</Button>
            <Button onClick={() => ticket && printCustomerReceipt(ticket)}><Printer className="mr-2 h-4 w-4" /> Reçu Client</Button>
            <Button variant="ghost" onClick={() => setTicket(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
