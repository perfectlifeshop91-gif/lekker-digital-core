import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "top_products",
  title: "Top selling products",
  description: "Rank the best-selling products by quantity sold, based on recent order items.",
  inputSchema: { limit: z.number().min(1).max(25).default(10) },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("order_items")
      .select("name, quantity, subtotal")
      .limit(2000);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const map = new Map<string, { name: string; quantity: number; revenue: number }>();
    for (const i of data ?? []) {
      const cur = map.get(i.name) ?? { name: i.name, quantity: 0, revenue: 0 };
      cur.quantity += i.quantity ?? 0;
      cur.revenue += Number(i.subtotal ?? 0);
      map.set(i.name, cur);
    }
    const ranked = Array.from(map.values())
      .map(r => ({ ...r, revenue: +r.revenue.toFixed(2) }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);
    return {
      content: [{ type: "text", text: JSON.stringify(ranked, null, 2) }],
      structuredContent: { products: ranked },
    };
  },
});
