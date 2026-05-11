import { createFileRoute } from "@tanstack/react-router";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { convertToModelMessages, streamText, tool, stepCountIs, type UIMessage } from "ai";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import "@tanstack/react-start";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const body = (await request.json()) as { messages?: unknown };
        if (!Array.isArray(body.messages)) return new Response("Messages required", { status: 400 });

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const SUPA_URL = process.env.SUPABASE_URL!;
        const SUPA_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const supa = createClient(SUPA_URL, SUPA_KEY);

        const gateway = createOpenAICompatible({
          name: "lovable",
          baseURL: "https://ai.gateway.lovable.dev/v1",
          headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
        });
        const model = gateway("google/gemini-3-flash-preview");

        const tools = {
          getRevenue: tool({
            description: "Get total revenue and order count for the last N days (default 7).",
            inputSchema: z.object({ days: z.number().min(1).max(90).default(7) }),
            execute: async ({ days }) => {
              const since = new Date(); since.setDate(since.getDate() - days);
              const { data } = await supa.from("orders").select("total").is("deleted_at", null).gte("created_at", since.toISOString());
              const total = (data ?? []).reduce((s: number, o: any) => s + Number(o.total), 0);
              return { days, orders: data?.length ?? 0, revenue: +total.toFixed(2), currency: "DH" };
            },
          }),
          getTopProducts: tool({
            description: "Get the best-selling products by quantity for the last 30 days.",
            inputSchema: z.object({ limit: z.number().min(1).max(20).default(5) }),
            execute: async ({ limit }) => {
              const { data } = await supa.from("order_items").select("name, quantity, subtotal").limit(2000);
              const map = new Map<string, { name: string; qty: number; revenue: number }>();
              (data ?? []).forEach((i: any) => {
                const c = map.get(i.name) ?? { name: i.name, qty: 0, revenue: 0 };
                c.qty += i.quantity; c.revenue += Number(i.subtotal); map.set(i.name, c);
              });
              return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, limit);
            },
          }),
          listMenu: tool({
            description: "List active menu products by category. Use to recommend items to customers.",
            inputSchema: z.object({ category: z.string().optional() }),
            execute: async ({ category }) => {
              let q = supa.from("products").select("name, category, price, description").eq("active", true).eq("available", true);
              if (category) q = q.eq("category", category);
              const { data } = await q.limit(50);
              return data ?? [];
            },
          }),
        };

        const result = streamText({
          model,
          tools,
          stopWhen: stepCountIs(50),
          system: "You are LEKKER's smart assistant for an Al Hoceima crêpe & drinks shop. Help customers pick items and help admins analyze business. Reply in the language of the user (French, Arabic, English, Spanish, Tarifit). Be warm and concise.",
          messages: await convertToModelMessages(body.messages as UIMessage[]),
        });
        return result.toUIMessageStreamResponse({ originalMessages: body.messages as UIMessage[] });
      },
    },
  },
});
