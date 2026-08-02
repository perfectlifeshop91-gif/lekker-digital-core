import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "revenue_summary",
  title: "Revenue summary",
  description: "Summarize revenue, order count and average basket over the last N days.",
  inputSchema: { days: z.number().min(1).max(365).default(7) },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ days }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const { data, error } = await supabase
      .from("orders")
      .select("total, payment_method, created_at")
      .is("deleted_at", null)
      .gte("created_at", since);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const rows = data ?? [];
    const revenue = rows.reduce((s, o) => s + Number(o.total ?? 0), 0);
    const byPayment: Record<string, number> = {};
    for (const o of rows) {
      const k = o.payment_method ?? "unknown";
      byPayment[k] = +(((byPayment[k] ?? 0) + Number(o.total ?? 0))).toFixed(2);
    }
    const summary = {
      days,
      orders: rows.length,
      revenue: +revenue.toFixed(2),
      average_basket: rows.length ? +(revenue / rows.length).toFixed(2) : 0,
      currency: "DH",
      by_payment_method: byPayment,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      structuredContent: summary,
    };
  },
});
