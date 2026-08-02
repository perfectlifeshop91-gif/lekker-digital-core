import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_order",
  title: "Get order details",
  description: "Get one order with all its line items, by order number.",
  inputSchema: { order_number: z.number().int().describe("The order number, e.g. 1042.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ order_number }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, order_number, status, subtotal, discount, tip, tax, total, payment_method, table_number, customer_name, notes, created_at")
      .eq("order_number", order_number)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!order) throw new ToolError(`No order found with number ${order_number}.`);
    const { data: items } = await supabase
      .from("order_items")
      .select("name, quantity, price, subtotal, notes")
      .eq("order_id", order.id);
    const payload = { ...order, items: items ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: { order: payload },
    };
  },
});
