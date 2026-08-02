import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "update_order_status",
  title: "Update order status",
  description: "Advance an order's kitchen/service status (pending, preparing, ready, delivered, paid, cancelled).",
  inputSchema: {
    order_number: z.number().int().describe("The order number to update."),
    status: z.enum(["pending", "preparing", "ready", "delivered", "paid", "cancelled"]),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ order_number, status }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("order_number", order_number)
      .is("deleted_at", null)
      .select("order_number, status")
      .maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) throw new ToolError(`Order ${order_number} not found, or you lack permission to update it.`);
    return {
      content: [{ type: "text", text: `Order #${data.order_number} is now "${data.status}".` }],
      structuredContent: { order: data },
    };
  },
});
