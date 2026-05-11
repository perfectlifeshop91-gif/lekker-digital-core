# LEKKER Enterprise Upgrade — Phase 2 + 3

Tu veux qu'on transforme la plateforme en vrai SaaS restaurant complet. Voici le plan détaillé que je vais exécuter (Instagram @lekker___1 = référence brand visuelle).

## 1. Multi-langue (FR · AR · Tarifit · EN · ES)
- `src/lib/i18n.ts` — dictionnaire complet + `useT()` hook + sélecteur global (persist localStorage)
- Sélecteur de langue dans header (drapeaux)
- **Tickets imprimés** : la langue choisie au checkout (par client) détermine la langue du ticket client. Ticket cuisine reste FR (langue staff).
- Support RTL pour AR + Tarifit (`dir="rtl"`)

## 2. Auth serveur — bouton dédié
- Sur `/auth` : 2 onglets clairs **"Client / Public"** vs **"Personnel (Serveur · Cuisine · Admin)"**
- Bouton "Créer compte serveur" → signup avec rôle `waiter` auto-assigné via trigger
- Après login, redirection automatique selon rôle :
  - waiter → `/waiter`
  - kitchen → `/kitchen`
  - admin/cashier → `/admin`

## 3. Écran Cuisine temps réel (`/kitchen`)
- 3 colonnes : **En attente · En préparation · Prêt**
- Supabase Realtime sur `orders` + `order_items`
- Click sur carte → avance le statut (pending → preparing → ready → delivered)
- Son de notification quand nouvelle commande arrive
- Affiche : N° commande, table, items + qty + notes, temps écoulé (chrono live)
- Pas de prix (focus cuisine)

## 4. Dashboard Serveur (`/waiter`)
- Stats perso : commandes actives, terminées aujourd'hui, CA généré, pourboires
- Liste commandes assignées avec statut live
- Bouton "Nouvelle commande" → ouvre `/pos` avec `waiter_id` auto
- Vue "À servir" (orders status=ready de ses tables)

## 5. Orders : modal détails + reprint
- Sur `/orders` : bouton **"Voir"** sur chaque ligne → modal avec :
  - Tous les items, qty, prix, notes
  - Total, paiement, table, serveur, date
  - 2 boutons : **"Imprimer ticket client"** + **"Imprimer ticket cuisine"**
  - Bouton "Annuler commande" (soft delete, admin only)

## 6. Admin CRUD Produits (`/admin/products`)
- Table avec recherche, filtre catégorie
- Bouton "Ajouter produit" → modal (nom, catégorie, prix, prix promo, description, ingrédients, allergènes, stock, temps prép, calories, image upload, disponible)
- Edit / Duplicate / Delete (admin only via RLS)
- Upload images vers bucket Supabase Storage `product-images`

## 7. Admin Analytics avancées (`/admin/analytics`)
- KPI cards : CA jour/semaine/mois/année, nb commandes, panier moyen, top serveur
- Recharts : ligne CA 30 jours, bar top 10 produits, pie répartition catégories, heatmap heures de pointe
- Leaderboard serveurs (CA, nb commandes, pourboires)
- Export CSV

## 8. AI Assistant (`/admin/ai` + widget mobile)
- Lovable AI Gateway (`google/gemini-3-flash-preview`)
- Server function `src/lib/ai.functions.ts` avec tools : `getRevenue`, `getTopProducts`, `getSlowProducts`, `getWaiterStats`
- Widget chat flottant sur admin + client (recommandations produits, multilingue)
- Vercel AI SDK + `useChat`

## 9. POS Mobile-first
- POS responsive : grid produits 2 cols sur mobile, panier en drawer bas
- Boutons gros, touch-friendly
- Sélecteur de langue ticket avant checkout
- Tout fonctionne identique au desktop

## 10. Schéma DB ajouts
- Trigger : auto-assign rôle `waiter` au signup (sauf si déjà admin)
- Storage bucket `product-images` (public read, admin write)
- Realtime publication sur `orders` + `order_items`

## Ordre d'exécution (1 seule passe)
1. Migration DB (storage bucket, realtime, trigger waiter, fix RLS si besoin)
2. `src/lib/i18n.ts` + `LanguageSwitcher`
3. Refacto `printing.ts` — accepte `lang` param
4. `/auth` — onglets + signup serveur
5. `/kitchen` — realtime board
6. `/waiter` — dashboard perso
7. `/orders` — modal détails + reprint
8. `/admin/products` — CRUD complet
9. `/admin/analytics` — Recharts + KPIs
10. `/admin/ai` + chat widget — Lovable AI
11. `/pos` — mobile responsive + sélecteur langue ticket
12. Update `/admin` tiles avec liens fonctionnels

C'est gros mais cohérent. Je fais tout dans cette boucle. Dis "go" et je démarre par la migration DB.