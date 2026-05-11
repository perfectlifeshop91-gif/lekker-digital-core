import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Pencil, Trash2, Copy, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { getProductImage } from "@/lib/product-images";

export const Route = createFileRoute("/admin/products")({
  component: ProductsPage,
  head: () => ({ meta: [{ title: "LEKKER · Gestion produits" }] }),
});

type Product = {
  id: string; name: string; category: string; price: number; promo_price: number | null;
  description: string | null; ingredients: string | null; allergens: string | null;
  stock: number | null; prep_time: number | null; calories: number | null;
  available: boolean; active: boolean; image: string | null;
};

const CATEGORIES = ["crepes", "juices", "mojitos", "icecream", "drinks", "desserts"];

function emptyProduct(): Partial<Product> {
  return { name: "", category: "crepes", price: 0, available: true, active: true, stock: 999, prep_time: 5 };
}

function ProductsPage() {
  const nav = useNavigate();
  const [list, setList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) return nav({ to: "/auth" });
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", s.session.user.id);
      const admin = (roles ?? []).some(r => r.role === "admin");
      setIsAdmin(admin);
      if (!admin) toast.warning("Vous devez être admin pour modifier les produits");
    })();
  }, [nav]);

  const reload = async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").order("category").order("name");
    setList((data as Product[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { reload(); }, []);

  const filtered = list.filter(p =>
    (cat === "all" || p.category === cat) &&
    (!search || p.name.toLowerCase().includes(search.toLowerCase()))
  );

  const save = async () => {
    if (!editing?.name || !editing.category || editing.price == null) return toast.error("Champs obligatoires manquants");
    setSaving(true);
    const payload: any = {
      name: editing.name, category: editing.category, price: editing.price,
      promo_price: editing.promo_price || null,
      description: editing.description || null, ingredients: editing.ingredients || null,
      allergens: editing.allergens || null, stock: editing.stock ?? 999,
      prep_time: editing.prep_time ?? 5, calories: editing.calories || null,
      available: editing.available ?? true, active: editing.active ?? true,
      image: editing.image || null,
    };
    const { error } = editing.id
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Enregistré");
    setEditing(null);
    reload();
  };

  const remove = async (p: Product) => {
    if (!confirm(`Supprimer "${p.name}" ?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Supprimé");
    reload();
  };

  const duplicate = async (p: Product) => {
    const { id, ...rest } = p;
    const { error } = await supabase.from("products").insert({ ...rest, name: p.name + " (copie)" });
    if (error) return toast.error(error.message);
    toast.success("Dupliqué");
    reload();
  };

  const uploadImage = async (file: File) => {
    if (!editing) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    setUploading(false);
    if (error) return toast.error(error.message);
    const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
    setEditing({ ...editing, image: pub.publicUrl });
    toast.success("Image téléchargée");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="rounded-md p-2 hover:bg-muted"><ArrowLeft className="h-4 w-4" /></Link>
            <h1 className="font-serif text-lg font-semibold">Gestion des produits</h1>
          </div>
          {isAdmin && (
            <Button size="sm" onClick={() => setEditing(emptyProduct())}>
              <Plus className="mr-2 h-4 w-4" />Nouveau produit
            </Button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-4 p-4">
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8 w-64" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Button variant={cat === "all" ? "default" : "outline"} size="sm" onClick={() => setCat("all")}>Tout ({list.length})</Button>
          {CATEGORIES.map(c => (
            <Button key={c} variant={cat === c ? "default" : "outline"} size="sm" onClick={() => setCat(c)}>
              {c} ({list.filter(p => p.category === c).length})
            </Button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Image</th>
                <th className="px-3 py-2 text-left">Nom</th>
                <th className="px-3 py-2 text-left">Catégorie</th>
                <th className="px-3 py-2 text-right">Prix</th>
                <th className="px-3 py-2 text-center">Stock</th>
                <th className="px-3 py-2 text-center">Dispo</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Chargement…</td></tr>}
              {filtered.map(p => (
                <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-3 py-2"><img src={p.image || getProductImage(p.name, p.category)} className="h-10 w-10 rounded object-cover" alt="" /></td>
                  <td className="px-3 py-2 font-medium">{p.name}</td>
                  <td className="px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">{p.category}</td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {p.promo_price ? <span><s className="text-muted-foreground text-xs">{p.price}</s> <span className="text-primary">{p.promo_price}</span></span> : `${p.price}`} DH
                  </td>
                  <td className="px-3 py-2 text-center text-muted-foreground">{p.stock ?? "—"}</td>
                  <td className="px-3 py-2 text-center">{p.available ? "✅" : "❌"}</td>
                  <td className="px-3 py-2 text-right">
                    {isAdmin && (
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setEditing(p)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => duplicate(p)}><Copy className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => remove(p)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Modifier" : "Nouveau"} produit</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Nom *</Label><Input value={editing.name ?? ""} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
                <div>
                  <Label>Catégorie *</Label>
                  <Select value={editing.category} onValueChange={v => setEditing({ ...editing, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Prix DH *</Label><Input type="number" step="0.01" value={editing.price ?? 0} onChange={e => setEditing({ ...editing, price: +e.target.value })} /></div>
                <div><Label>Prix promo</Label><Input type="number" step="0.01" value={editing.promo_price ?? ""} onChange={e => setEditing({ ...editing, promo_price: e.target.value ? +e.target.value : null })} /></div>
                <div><Label>Stock</Label><Input type="number" value={editing.stock ?? 999} onChange={e => setEditing({ ...editing, stock: +e.target.value })} /></div>
                <div><Label>Temps prép (min)</Label><Input type="number" value={editing.prep_time ?? 5} onChange={e => setEditing({ ...editing, prep_time: +e.target.value })} /></div>
                <div><Label>Calories</Label><Input type="number" value={editing.calories ?? ""} onChange={e => setEditing({ ...editing, calories: e.target.value ? +e.target.value : null })} /></div>
              </div>
              <div><Label>Description</Label><Textarea rows={2} value={editing.description ?? ""} onChange={e => setEditing({ ...editing, description: e.target.value })} /></div>
              <div><Label>Ingrédients</Label><Textarea rows={2} value={editing.ingredients ?? ""} onChange={e => setEditing({ ...editing, ingredients: e.target.value })} /></div>
              <div><Label>Allergènes</Label><Input value={editing.allergens ?? ""} onChange={e => setEditing({ ...editing, allergens: e.target.value })} placeholder="Lactose, gluten…" /></div>
              <div>
                <Label>Image</Label>
                <div className="flex items-center gap-2">
                  {editing.image && <img src={editing.image} className="h-12 w-12 rounded object-cover" alt="" />}
                  <label className="flex-1">
                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])} />
                    <Button type="button" variant="outline" disabled={uploading} asChild><span><Upload className="mr-2 h-4 w-4" />{uploading ? "Upload…" : "Choisir image"}</span></Button>
                  </label>
                </div>
                <Input className="mt-2" placeholder="ou URL" value={editing.image ?? ""} onChange={e => setEditing({ ...editing, image: e.target.value })} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label>Disponible à la vente</Label>
                <Switch checked={editing.available ?? true} onCheckedChange={v => setEditing({ ...editing, available: v })} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label>Visible (actif)</Label>
                <Switch checked={editing.active ?? true} onCheckedChange={v => setEditing({ ...editing, active: v })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
