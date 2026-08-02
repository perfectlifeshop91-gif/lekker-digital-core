import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_orders",
  title: "List orders",
  description: "List recent orders, optionally filtered by status or number of past days.",
  inputSchema: {
    status: z.enum(["pending", "preparing", "ready", "delivered", "paid", "cancelled"]).optional(),
    days: z.number().min(1).max(90).default(1).describe("How many past days to include."),
    limit: z.number().min(1).max(100).default(25),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, days, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const since = new Date(Date.now() - days * 86400000).toISOString();
    let q = supabase
      .from("orders")
      .select("id, order_number, status, total, payment_method, table_number, customer_name, created_at")
      .is("deleted_at", null)
      .gte("created_at", since);
    if (status) q = q.eq("status", status);
    const { data, error } = await q.order("created_at", { ascending: false }).limit(limit);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { orders: data ?? [] },
    };
  },
});
