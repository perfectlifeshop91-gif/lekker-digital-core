import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Download, TrendingUp, ShoppingCart, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { StaffNav } from "@/components/StaffNav";
import { useRouteGuard } from "@/lib/roles";

export const Route = createFileRoute("/admin/analytics")({
  component: AnalyticsPage,
  head: () => ({ meta: [{ title: "LEKKER · Analytics" }] }),
});

type Order = { id: string; total: number; created_at: string; payment_method: string };
type Item = { name: string; quantity: number; subtotal: number; product_id: string | null };

const COLORS = ["#d4a574", "#8b5a2b", "#c89b6d", "#a87a52", "#e6c9a0", "#704324", "#dab896"];

function AnalyticsPage() {
  useRouteGuard("/admin/analytics");
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const since = new Date(); since.setDate(since.getDate() - 30);
      const [{ data: o }, { data: i }] = await Promise.all([
        supabase.from("orders").select("id, total, created_at, payment_method").is("deleted_at", null).gte("created_at", since.toISOString()),
        supabase.from("order_items").select("name, quantity, subtotal, product_id").limit(5000),
      ]);
      setOrders((o as Order[]) ?? []);
      setItems((i as Item[]) ?? []);
      setLoading(false);
    })();
  }, []);

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

  const exportCsv = async () => {
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    wb.creator = "LEKKER"; wb.created = new Date();

    const brand = "FFD4A574";
    const dark = "FF3D2817";
    const light = "FFFBF5EC";
    const border = { top: { style: "thin", color: { argb: "FFE0D5C0" } }, left: { style: "thin", color: { argb: "FFE0D5C0" } }, bottom: { style: "thin", color: { argb: "FFE0D5C0" } }, right: { style: "thin", color: { argb: "FFE0D5C0" } } } as any;
    const titleFont = { name: "Calibri", size: 18, bold: true, color: { argb: dark } } as any;
    const headerFill = { type: "pattern", pattern: "solid", fgColor: { argb: brand } } as any;
    const headerFont = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } } as any;
    const zebra = { type: "pattern", pattern: "solid", fgColor: { argb: light } } as any;

    const sectionTitle = (ws: any, row: number, label: string) => {
      ws.mergeCells(row, 1, row, 8);
      const c = ws.getCell(row, 1);
      c.value = label; c.font = titleFont;
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5E6CC" } };
      c.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
      ws.getRow(row).height = 32;
    };
    const styleHeader = (ws: any, row: number, cols: number) => {
      for (let i = 1; i <= cols; i++) {
        const c = ws.getCell(row, i);
        c.fill = headerFill; c.font = headerFont; c.border = border;
        c.alignment = { vertical: "middle", horizontal: "center" };
      }
      ws.getRow(row).height = 24;
    };
    const styleBody = (ws: any, startRow: number, endRow: number, cols: number) => {
      for (let r = startRow; r <= endRow; r++) {
        for (let i = 1; i <= cols; i++) {
          const c = ws.getCell(r, i);
          c.border = border;
          c.alignment = { vertical: "middle", horizontal: i === 1 ? "left" : "right", indent: 1 };
          if ((r - startRow) % 2 === 1) c.fill = zebra;
        }
      }
    };

    // ===== Sheet 1: Synthèse =====
    const s1 = wb.addWorksheet("Synthèse", { views: [{ showGridLines: false }] });
    s1.columns = [{ width: 32 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 22 }];
    sectionTitle(s1, 1, "LEKKER · Tableau de bord (30 derniers jours)");
    s1.getCell("A2").value = `Généré le ${new Date().toLocaleString("fr-FR")}`;
    s1.getCell("A2").font = { italic: true, color: { argb: "FF7A6B57" } };

    const kpis = [
      ["Indicateur", "Valeur", "Format"],
      ["CA aujourd'hui (DH)", stats.todayRev, "currency"],
      ["CA 7 jours (DH)", stats.weekRev, "currency"],
      ["CA 30 jours (DH)", stats.monthRev, "currency"],
      ["Commandes 30j", stats.count, "int"],
      ["Commandes aujourd'hui", stats.todayCount, "int"],
      ["Panier moyen (DH)", +stats.avg.toFixed(2), "currency"],
      ["Pic horaire", hourPeaks.reduce((a, b) => b.count > a.count ? b : a, { hour: "—", count: 0 }).hour, "text"],
    ];
    const kpiStart = 4;
    kpis.forEach((row, i) => {
      s1.getRow(kpiStart + i).values = [row[0], row[1]];
    });
    styleHeader(s1, kpiStart, 2);
    styleBody(s1, kpiStart + 1, kpiStart + kpis.length - 1, 2);
    for (let i = 1; i < kpis.length; i++) {
      const c = s1.getCell(kpiStart + i, 2);
      const fmt = kpis[i][2];
      if (fmt === "currency") c.numFmt = '#,##0.00" DH"';
      if (fmt === "int") c.numFmt = "#,##0";
      c.font = { bold: true, size: 12, color: { argb: dark } };
    }

    // ===== Sheet 2: Revenus journaliers =====
    const s2 = wb.addWorksheet("Revenus journaliers", { views: [{ showGridLines: false }] });
    s2.columns = [{ width: 16 }, { width: 22 }, { width: 22 }, { width: 22 }];
    sectionTitle(s2, 1, "Chiffre d'affaires journalier · 30 jours");
    const h2Row = 3;
    s2.getRow(h2Row).values = ["Date", "CA (DH)", "Commandes", "Panier moyen (DH)"];
    styleHeader(s2, h2Row, 4);
    dailySeries.forEach((d, i) => {
      const dayOrders = orders.filter(o => new Date(o.created_at).toISOString().slice(5, 10) === d.date);
      const avg = dayOrders.length ? d.total / dayOrders.length : 0;
      s2.getRow(h2Row + 1 + i).values = [d.date, d.total, dayOrders.length, +avg.toFixed(2)];
    });
    const s2End = h2Row + dailySeries.length;
    styleBody(s2, h2Row + 1, s2End, 4);
    s2.getColumn(2).numFmt = '#,##0.00" DH"';
    s2.getColumn(4).numFmt = '#,##0.00" DH"';
    // Total row
    const totalRow2 = s2End + 1;
    s2.getRow(totalRow2).values = ["TOTAL", { formula: `SUM(B${h2Row + 1}:B${s2End})` }, { formula: `SUM(C${h2Row + 1}:C${s2End})` }, { formula: `IFERROR(B${totalRow2}/C${totalRow2},0)` }];
    for (let i = 1; i <= 4; i++) {
      const c = s2.getCell(totalRow2, i);
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: brand } } as any;
      c.font = { bold: true, color: { argb: "FFFFFFFF" } };
      c.border = border;
    }
    s2.getCell(totalRow2, 2).numFmt = '#,##0.00" DH"';
    s2.getCell(totalRow2, 4).numFmt = '#,##0.00" DH"';
    // Data bar conditional formatting on CA
    s2.addConditionalFormatting({
      ref: `B${h2Row + 1}:B${s2End}`,
      rules: [{ type: "dataBar", priority: 1, cfvo: [{ type: "min" }, { type: "max" }], color: { argb: brand } } as any],
    });

    // ===== Sheet 3: Top produits =====
    const s3 = wb.addWorksheet("Top produits", { views: [{ showGridLines: false }] });
    s3.columns = [{ width: 8 }, { width: 36 }, { width: 18 }, { width: 22 }, { width: 22 }];
    sectionTitle(s3, 1, "Top produits · 30 jours");
    const h3 = 3;
    s3.getRow(h3).values = ["Rang", "Produit", "Quantité", "Revenu (DH)", "Prix moyen (DH)"];
    styleHeader(s3, h3, 5);
    topProducts.forEach((p, i) => {
      s3.getRow(h3 + 1 + i).values = [i + 1, p.name, p.qty, +p.revenue.toFixed(2), p.qty ? +(p.revenue / p.qty).toFixed(2) : 0];
    });
    const s3End = h3 + topProducts.length;
    styleBody(s3, h3 + 1, s3End, 5);
    s3.getColumn(4).numFmt = '#,##0.00" DH"';
    s3.getColumn(5).numFmt = '#,##0.00" DH"';
    s3.addConditionalFormatting({
      ref: `C${h3 + 1}:C${s3End}`,
      rules: [{ type: "dataBar", priority: 1, cfvo: [{ type: "min" }, { type: "max" }], color: { argb: "FF8B5A2B" } } as any],
    });
    s3.addConditionalFormatting({
      ref: `D${h3 + 1}:D${s3End}`,
      rules: [{ type: "dataBar", priority: 1, cfvo: [{ type: "min" }, { type: "max" }], color: { argb: brand } } as any],
    });

    // ===== Sheet 4: Paiements =====
    const s4 = wb.addWorksheet("Paiements", { views: [{ showGridLines: false }] });
    s4.columns = [{ width: 22 }, { width: 18 }, { width: 22 }, { width: 18 }];
    sectionTitle(s4, 1, "Répartition par mode de paiement");
    const h4 = 3;
    s4.getRow(h4).values = ["Mode", "Commandes", "Montant (DH)", "Part (%)"];
    styleHeader(s4, h4, 4);
    const totalPay = orders.reduce((s, o) => s + Number(o.total), 0);
    const payRows: [string, number, number, number][] = paymentSplit.map(p => {
      const sum = orders.filter(o => o.payment_method === p.name).reduce((s, o) => s + Number(o.total), 0);
      return [p.name, p.value, +sum.toFixed(2), totalPay ? +(sum / totalPay).toFixed(4) : 0];
    });
    payRows.forEach((r, i) => s4.getRow(h4 + 1 + i).values = r);
    const s4End = h4 + payRows.length;
    styleBody(s4, h4 + 1, s4End, 4);
    s4.getColumn(3).numFmt = '#,##0.00" DH"';
    s4.getColumn(4).numFmt = "0.00%";
    s4.addConditionalFormatting({
      ref: `D${h4 + 1}:D${s4End}`,
      rules: [{ type: "dataBar", priority: 1, cfvo: [{ type: "min" }, { type: "max" }], color: { argb: "FFC89B6D" } } as any],
    });

    // ===== Sheet 5: Heures de pointe =====
    const s5 = wb.addWorksheet("Heures de pointe", { views: [{ showGridLines: false }] });
    s5.columns = [{ width: 12 }, { width: 18 }, { width: 22 }];
    sectionTitle(s5, 1, "Activité par heure · 30 jours");
    const h5 = 3;
    s5.getRow(h5).values = ["Heure", "Commandes", "Intensité"];
    styleHeader(s5, h5, 3);
    const maxH = Math.max(1, ...hourPeaks.map(h => h.count));
    hourPeaks.forEach((h, i) => {
      s5.getRow(h5 + 1 + i).values = [h.hour, h.count, "█".repeat(Math.round((h.count / maxH) * 20))];
    });
    const s5End = h5 + hourPeaks.length;
    styleBody(s5, h5 + 1, s5End, 3);
    s5.addConditionalFormatting({
      ref: `B${h5 + 1}:B${s5End}`,
      rules: [{
        type: "colorScale", priority: 1,
        cfvo: [{ type: "min" }, { type: "percentile", value: 50 }, { type: "max" }],
        color: [{ argb: "FFFBF5EC" }, { argb: "FFE6C9A0" }, { argb: brand }],
      } as any],
    });

    // ===== Sheet 6: Commandes brutes =====
    const s6 = wb.addWorksheet("Commandes", { views: [{ showGridLines: false, state: "frozen", ySplit: 3 }] });
    s6.columns = [{ width: 22 }, { width: 14 }, { width: 18 }, { width: 22 }];
    sectionTitle(s6, 1, "Détail des commandes · 30 jours");
    const h6 = 3;
    s6.getRow(h6).values = ["Date", "Total (DH)", "Paiement", "ID"];
    styleHeader(s6, h6, 4);
    orders.forEach((o, i) => {
      s6.getRow(h6 + 1 + i).values = [new Date(o.created_at), +Number(o.total).toFixed(2), o.payment_method, o.id];
    });
    const s6End = h6 + orders.length;
    if (orders.length) styleBody(s6, h6 + 1, s6End, 4);
    s6.getColumn(1).numFmt = "yyyy-mm-dd hh:mm";
    s6.getColumn(2).numFmt = '#,##0.00" DH"';
    s6.autoFilter = { from: { row: h6, column: 1 }, to: { row: Math.max(h6, s6End), column: 4 } };

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `lekker-analytics-${new Date().toISOString().slice(0, 10)}.xlsx`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <StaffNav title="Analytics" />
      <div className="mx-auto flex max-w-7xl items-center justify-end px-4 py-3">
        <Button size="sm" variant="outline" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />Export CSV</Button>
      </div>

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
