import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Download, TrendingUp, ShoppingCart, DollarSign, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";

export const Route = createFileRoute("/admin/analytics")({
  component: AnalyticsPage,
  head: () => ({ meta: [{ title: "LEKKER · Analytics" }] }),
});

type Order = { id: string; total: number; created_at: string; payment_method: string };
type Item = { name: string; quantity: number; subtotal: number; product_id: string | null };

const COLORS = ["#d4a574", "#8b5a2b", "#c89b6d", "#a87a52", "#e6c9a0", "#704324", "#dab896"];

function AnalyticsPage() {
  const nav = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) return nav({ to: "/auth" });
      const since = new Date(); since.setDate(since.getDate() - 30);
      const [{ data: o }, { data: i }] = await Promise.all([
        supabase.from("orders").select("id, total, created_at, payment_method").is("deleted_at", null).gte("created_at", since.toISOString()),
        supabase.from("order_items").select("name, quantity, subtotal, product_id").limit(5000),
      ]);
      setOrders((o as Order[]) ?? []);
      setItems((i as Item[]) ?? []);
      setLoading(false);
    })();
  }, [nav]);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === today);
    const week = new Date(); week.setDate(week.getDate() - 7);
    const weekOrders = orders.filter(o => new Date(o.created_at) >= week);
    return {
      todayCount: todayOrders.length,
      todayRev: todayOrders.reduce((s, o) => s + Number(o.total), 0),
      weekRev: weekOrders.reduce((s, o) => s + Number(o.total), 0),
      monthRev: orders.reduce((s, o) => s + Number(o.total), 0),
      count: orders.length,
      avg: orders.length ? orders.reduce((s, o) => s + Number(o.total), 0) / orders.length : 0,
    };
  }, [orders]);

  const dailySeries = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      map.set(d.toISOString().slice(0, 10), 0);
    }
    orders.forEach(o => {
      const k = new Date(o.created_at).toISOString().slice(0, 10);
      if (map.has(k)) map.set(k, (map.get(k) ?? 0) + Number(o.total));
    });
    return Array.from(map.entries()).map(([date, total]) => ({ date: date.slice(5), total: +total.toFixed(2) }));
  }, [orders]);

  const topProducts = useMemo(() => {
    const m = new Map<string, { name: string; qty: number; revenue: number }>();
    items.forEach(i => {
      const cur = m.get(i.name) ?? { name: i.name, qty: 0, revenue: 0 };
      cur.qty += i.quantity; cur.revenue += Number(i.subtotal);
      m.set(i.name, cur);
    });
    return Array.from(m.values()).sort((a, b) => b.qty - a.qty).slice(0, 10);
  }, [items]);

  const paymentSplit = useMemo(() => {
    const m = new Map<string, number>();
    orders.forEach(o => m.set(o.payment_method, (m.get(o.payment_method) ?? 0) + 1));
    return Array.from(m.entries()).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const hourPeaks = useMemo(() => {
    const m = new Map<number, number>();
    for (let h = 0; h < 24; h++) m.set(h, 0);
    orders.forEach(o => { const h = new Date(o.created_at).getHours(); m.set(h, (m.get(h) ?? 0) + 1); });
    return Array.from(m.entries()).map(([hour, count]) => ({ hour: `${hour}h`, count }));
  }, [orders]);

  const exportCsv = () => {
    const rows = [["Date", "Total", "Paiement"], ...orders.map(o => [o.created_at, o.total.toString(), o.payment_method])];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "lekker-orders.csv"; a.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="rounded-md p-2 hover:bg-muted"><ArrowLeft className="h-4 w-4" /></Link>
            <h1 className="font-serif text-lg font-semibold">Analytics · 30 derniers jours</h1>
          </div>
          <Button size="sm" variant="outline" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />Export CSV</Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 p-4">
        {loading ? <div className="py-20 text-center">Chargement…</div> : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <KPI label="CA Aujourd'hui" value={`${stats.todayRev.toFixed(0)} DH`} icon={DollarSign} accent />
              <KPI label="CA 7 jours" value={`${stats.weekRev.toFixed(0)} DH`} icon={TrendingUp} />
              <KPI label="CA 30 jours" value={`${stats.monthRev.toFixed(0)} DH`} icon={TrendingUp} />
              <KPI label="Panier moyen" value={`${stats.avg.toFixed(0)} DH`} icon={ShoppingCart} />
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <h2 className="mb-3 font-serif text-lg font-semibold">Chiffre d'affaires (30 jours)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailySeries}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="#d4a574" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-4">
                <h2 className="mb-3 font-serif text-lg font-semibold">Top 10 produits (quantité)</h2>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={topProducts} layout="vertical" margin={{ left: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" fontSize={11} />
                    <YAxis type="category" dataKey="name" fontSize={10} width={100} />
                    <Tooltip />
                    <Bar dataKey="qty" fill="#8b5a2b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4">
                <h2 className="mb-3 font-serif text-lg font-semibold">Répartition paiement</h2>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie data={paymentSplit} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                      {paymentSplit.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <h2 className="mb-3 font-serif text-lg font-semibold">Heures de pointe</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={hourPeaks}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="hour" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#d4a574" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function KPI({ label, value, icon: Icon, accent }: { label: string; value: string; icon: any; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Icon className="h-4 w-4" />{label}</div>
      <div className={`mt-1 font-serif text-2xl font-bold ${accent ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}
