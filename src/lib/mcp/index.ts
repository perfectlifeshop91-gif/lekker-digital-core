import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listMenu from "./tools/list-menu";
import listOrders from "./tools/list-orders";
import getOrder from "./tools/get-order";
import revenueSummary from "./tools/revenue-summary";
import topProducts from "./tools/top-products";
import updateOrderStatus from "./tools/update-order-status";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "lekker-ai-suite",
  title: "Lekker AI Suite",
  version: "0.1.0",
  instructions:
    "Tools for LEKKER, a dessert & drinks restaurant platform (POS, kitchen, analytics). Use `list_menu` to browse products, `list_orders` and `get_order` to inspect orders, `revenue_summary` and `top_products` for business analytics, and `update_order_status` to move an order through the kitchen workflow. All tools act as the signed-in staff user, so results respect that user's permissions.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listMenu, listOrders, getOrder, revenueSummary, topProducts, updateOrderStatus],
});
