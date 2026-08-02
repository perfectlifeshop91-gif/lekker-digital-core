import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_menu",
  title: "List menu products",
  description: "List LEKKER menu products, optionally filtered by category or availability.",
  inputSchema: {
    category: z.string().optional().describe("Filter by category, e.g. Crêpes, Jus, Mojitos."),
    only_available: z.boolean().default(true).describe("Only include products currently available."),
    limit: z.number().min(1).max(100).default(50),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ category, only_available, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("products")
      .select("id, name, category, price, promo_price, description, stock, available, active")
      .eq("active", true);
    if (only_available) q = q.eq("available", true);
    if (category) q = q.eq("category", category);
    const { data, error } = await q.order("category").limit(limit);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { products: data ?? [] },
    };
  },
});
