This is a huge scope (POS + Kitchen + Waiters + Admin Analytics + AI + Printing + Auth/Roles + many products). I'll deliver it in **3 phases** so each is shippable. Confirm Phase 1 to start; I'll continue automatically into 2 and 3 unless you say otherwise.

## Phase 1 — Foundation, Auth & Roles, Expanded Menu, Dual Ticket Printing

**Database (migrations)**
- `profiles` (linked to auth.users): full_name, phone, avatar, shift_hours, salary, active
- `app_role` enum: `admin`, `waiter`, `kitchen`, `cashier`
- `user_roles` + `has_role()` security definer (no recursion)
- Extend `products`: description, ingredients, allergens, stock, prep_time, calories, promo_price, available, gallery
- Extend `orders`: status enum (pending/preparing/ready/delivered/canceled), waiter_id, discount, deleted_at (soft delete), tip
- `order_items`: notes
- `audit_logs`: user_id, action, entity, payload
- RLS: admins full access; waiters see own orders; kitchen sees active orders; public read for menu only

**Auth**
- Email/password + Google login at `/auth`
- `_authenticated` layout guard
- Auto-create profile + default role on signup via trigger

**Expanded Menu (DB seed)**
- All categories from the brief: Crêpes, Juices, Mojitos, Ice Cream, Hot/Cold Drinks, Desserts (~50 products with realistic prices in MAD)

**Dual Ticket Printing System**
- `src/lib/printing.ts`: `printKitchenTicket()` and `printCustomerReceipt()`
- Kitchen ticket: monochrome, no prices, big fonts, order#, table, waiter, items+qty+notes, time
- Customer receipt: logo, items, prices, tax, total, payment method, QR code (order id), thank-you, socials, scrollable preview, thermal-optimized print CSS (80mm)
- Auto-print both on checkout from POS

## Phase 2 — Smart POS, Kitchen Display, Waiter Dashboard

- Rebuild `/pos` with category filter, search, cart, qty, item notes, discount, tax, split/cash/card, customer name + table, assigned waiter (current user)
- `/kitchen`: realtime board (Supabase Realtime) showing pending → preparing → ready columns, drag/click to advance, no prices
- `/waiter`: waiter's own dashboard — active orders, completed today, revenue generated, tips, avg service time
- `/orders`: filters (date, waiter, status), modify/cancel/restore (soft delete), reprint receipt, export CSV

## Phase 3 — Admin Suite, Analytics, AI, Product/Staff Management

- `/admin` dashboard: KPI cards (today/week/month/year revenue, orders, AOV), Recharts (line/bar/pie), top/low products, peak hours heatmap, waiter leaderboard
- `/admin/products`: CRUD with image upload (Supabase Storage bucket `product-images`), categories, stock, promo, availability, duplicate
- `/admin/staff`: CRUD waiters/staff (invite, assign role, suspend, performance metrics, login history)
- `/admin/audit`: activity log table
- **AI Assistant** (`/admin/ai` + customer-facing chat widget) using Lovable AI Gateway (`google/gemini-3-flash-preview`):
  - Server function `src/lib/ai.functions.ts` with tools: `getRevenue`, `getTopProducts`, `getSlowProducts`, `getWaiterStats`, `recommendProduct`
  - Customer widget: recommend products, explain ingredients, FR/AR/EN
  - Admin chat: business analysis, anomaly detection, suggested promos

## UI / Design
- Keep luxury sand+chocolate theme; add glassmorphism panels, premium dashboard layout (sidebar + topbar), shadcn cards/tables/charts, smooth Framer-style transitions via CSS

## Tech notes
- TanStack Start route files only (no React Router)
- Supabase Realtime for orders/kitchen
- All secrets server-side; RLS enforced everywhere
- Receipts use a hidden print container + `window.print()` with `@media print` thermal CSS

---

**Reply "go" to start Phase 1** (or tell me which phase/feature to prioritize first if you want a different order). Phase 1 alone is already a large migration + auth + printing system + ~50 seeded products.