import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Instagram, Mail, MapPin, Sparkles, Star, Leaf, Clock, ArrowRight, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import logo from "@/assets/lekker-logo.jpg";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLang } from "@/lib/i18n";
import crepeChoco from "@/assets/crepe-chocolate.jpg";
import crepePistachio from "@/assets/crepe-pistachio.jpg";
import juiceStrawberry from "@/assets/juice-strawberry.jpg";
import juiceMango from "@/assets/juice-mango.jpg";
import mojitoBlueberry from "@/assets/mojito-blueberry.jpg";
import mojitoTropical from "@/assets/products/mojito-tropical.jpg";
import mojitoClassic from "@/assets/products/mojito-classic.jpg";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "LEKKER — Premium Crêpes, Juices & Mojitos · Al Hoceima" },
      { name: "description", content: "LEKKER — A luxury crêpe & drinks experience in Al Hoceima. Premium crêpes, fresh juices, mojitos and artisan gelato." },
      { property: "og:title", content: "LEKKER — Un goût ♡ bonheur" },
      { property: "og:description", content: "Premium crêpes, fresh juices, mojitos & artisan gelato in Al Hoceima." },
    ],
  }),
});

function Index() {
  const { t, dir } = useLang();
  const [active, setActive] = useState("crepes");

  const categories = [
    { id: "crepes", label: t("home_cat_crepes"), icon: "🥞", items: [
      { name: "Crêpe Nutella Royale", desc: "Nutella fondant, éclats de noisette.", price: "45 DH", img: crepeChoco, tag: "Bestseller" },
      { name: "Crêpe Pistachio Fraise", desc: "Crème de pistache, fraises fraîches.", price: "55 DH", img: crepePistachio, tag: "Signature" },
      { name: "Crêpe Lotus Caramel", desc: "Pâte Lotus Biscoff, caramel beurre salé.", price: "50 DH", img: crepeChoco },
      { name: "Crêpe Kinder Bueno", desc: "Crème Kinder, gaufrettes croustillantes.", price: "52 DH", img: crepePistachio },
    ]},
    { id: "juices", label: t("home_cat_juices"), icon: "🥭", items: [
      { name: "Mango Sunrise", desc: "Mangue Alphonso pressée, glace pilée.", price: "35 DH", img: juiceMango, tag: "Fresh" },
      { name: "Strawberry Bliss", desc: "Fraises fraîches, menthe, citron vert.", price: "32 DH", img: juiceStrawberry },
      { name: "Tropical Detox", desc: "Ananas, gingembre, citron, pomme verte.", price: "38 DH", img: juiceMango },
      { name: "Avocado Velvet", desc: "Avocat crémeux, lait d'amande, miel.", price: "40 DH", img: juiceStrawberry },
    ]},
    { id: "mojitos", label: t("home_cat_mojitos"), icon: "🌿", items: [
      { name: "Blueberry Mojito", desc: "Myrtilles, menthe fraîche, citron vert.", price: "42 DH", img: mojitoBlueberry, tag: "100% Gourmand" },
      { name: "Tropical Mojito", desc: "Mangue, ananas, citron vert, menthe.", price: "42 DH", img: mojitoTropical },
      { name: "Classic Mojito", desc: "La recette intemporelle.", price: "38 DH", img: mojitoClassic },
      { name: "Strawberry Mojito", desc: "Fraises mûres, menthe, eau gazeuse.", price: "40 DH", img: juiceStrawberry },
    ]},
    { id: "icecream", label: t("home_cat_icecream"), icon: "🍦", items: [
      { name: "Pistache Artisanale", desc: "Glace pistache de Sicile.", price: "30 DH", img: crepePistachio },
      { name: "Chocolat Noir 70%", desc: "Cacao Valrhona intense.", price: "28 DH", img: crepeChoco },
      { name: "Vanille Bourbon", desc: "Gousses de vanille de Madagascar.", price: "26 DH", img: juiceMango },
      { name: "Lotus Caramel", desc: "Glace caramel, brisures Lotus.", price: "30 DH", img: crepeChoco },
    ]},
  ];
  const current = categories.find((c) => c.id === active)!;

  const navItems = [
    { to: "/" as const, label: t("home_home") },
    { to: "/#menu", label: t("home_menu"), anchor: true },
    { to: "/pos" as const, label: t("home_pos") },
    { to: "/kitchen" as const, label: t("home_kitchen") },
    { to: "/waiter" as const, label: t("home_waiter") },
    { to: "/admin" as const, label: t("home_admin") },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground" dir={dir}>
      {/* Floating pill NAV */}
      <header className="sticky top-0 z-50 px-3 pt-3 sm:pt-5">
        <div className="mx-auto max-w-6xl flex items-center gap-2 rounded-full border border-border/60 bg-card/80 backdrop-blur-xl px-3 py-2 shadow-soft">
          <Link to="/" className="flex items-center gap-2 shrink-0 pl-1">
            <img src={logo} alt="LEKKER" className="h-9 w-9 rounded-full object-cover ring-1 ring-primary/30" />
            <span className="hidden sm:inline text-lg font-semibold tracking-tight" style={{ fontFamily: "'Cormorant Garamond',serif" }}>LEKKER</span>
          </Link>

          <nav className="mx-auto flex items-center gap-1 overflow-x-auto no-scrollbar text-sm">
            {navItems.map((item) => (
              item.anchor ? (
                <a key={item.label} href="#menu"
                  className="px-3 sm:px-4 py-2 rounded-full whitespace-nowrap text-muted-foreground hover:text-foreground hover:bg-muted/60 transition">
                  {item.label}
                </a>
              ) : (
                <Link key={item.label} to={item.to as any}
                  activeOptions={{ exact: true }}
                  activeProps={{ className: "px-3 sm:px-4 py-2 rounded-full whitespace-nowrap bg-primary text-primary-foreground" }}
                  inactiveProps={{ className: "px-3 sm:px-4 py-2 rounded-full whitespace-nowrap text-muted-foreground hover:text-foreground hover:bg-muted/60 transition" }}>
                  {item.label}
                </Link>
              )
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <LanguageSwitcher />
            <a href="#menu"
              className="hidden sm:inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition shadow-soft">
              {t("home_order")}
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section id="top" className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-warm opacity-70" />
        <div className="absolute top-20 -left-32 -z-10 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl" />

        <div className="max-w-7xl mx-auto px-6 pt-16 pb-24 md:pt-24 md:pb-32 grid md:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card border border-border text-xs uppercase tracking-widest text-muted-foreground mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {t("home_location")}
            </div>
            <h1 className="font-semibold leading-[0.95] text-balance" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
              <span className="block text-6xl md:text-8xl">{t("home_hero_sweet")}</span>
              <span className="block text-6xl md:text-8xl italic text-primary mt-1">{t("home_hero_refined")}</span>
            </h1>
            <p className="mt-8 text-lg text-muted-foreground max-w-lg">
              {t("home_hero_desc")}
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <a href="#menu" className="group inline-flex items-center gap-2 bg-primary text-primary-foreground px-7 py-4 rounded-full font-medium shadow-luxe hover:scale-[1.02] transition">
                {t("home_explore")}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </a>
              <Link to="/pos" className="inline-flex items-center gap-2 bg-card border border-primary/20 px-7 py-4 rounded-full font-medium hover:bg-muted/50 transition">
                {t("home_open_pos")}
              </Link>
            </div>
            <div className="mt-12 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5"><Star className="w-4 h-4 fill-primary text-primary" /> 100% Gourmand</div>
              <div className="flex items-center gap-1.5"><Leaf className="w-4 h-4" /> Fresh · Natural</div>
              <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Crafted daily</div>
            </div>
          </div>

          <div className="relative">
            <div className="relative animate-float">
              <img src={crepePistachio} alt="Signature pistachio crêpe" className="rounded-[2rem] shadow-luxe w-full object-cover aspect-[4/5]" />
              {/* Floating juice card top-right */}
              <div className="absolute -top-6 -right-4 sm:-right-10 rotate-6 bg-card rounded-3xl p-2 shadow-luxe border border-border w-40">
                <img src={mojitoTropical} alt="Tropical mojito" className="rounded-2xl w-full aspect-square object-cover" />
              </div>
              {/* Bottom badge */}
              <div className="absolute -bottom-6 -left-6 bg-card border border-border rounded-2xl px-5 py-3 shadow-soft">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Signature</div>
                <div className="font-semibold">Crêpe Pistachio</div>
              </div>
              <div className="absolute top-1/2 -left-6 -translate-y-1/2 bg-primary text-primary-foreground rounded-full h-20 w-20 grid place-items-center text-[10px] font-semibold text-center leading-tight shadow-luxe rotate-[-8deg]">
                100%<br />GOURMAND
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MENU */}
      <section id="menu" className="py-24 bg-card/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs uppercase tracking-[0.4em] text-muted-foreground">{t("home_menu_title")}</div>
            <h2 className="text-4xl md:text-5xl mt-3" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
              {t("home_menu_sub")}
            </h2>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {categories.map((c) => (
              <button key={c.id} onClick={() => setActive(c.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium border transition ${
                  active === c.id ? "bg-primary text-primary-foreground border-primary shadow-soft" : "bg-background border-border hover:border-primary/40"
                }`}>
                <span className="mr-1.5">{c.icon}</span> {c.label}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {current.items.map((p) => (
              <article key={p.name} className="group bg-background rounded-3xl overflow-hidden border border-border hover:shadow-luxe transition-all duration-500 hover:-translate-y-1">
                <div className="relative aspect-square overflow-hidden">
                  <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  {p.tag && (
                    <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full">{p.tag}</span>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-xl font-semibold">{p.name}</h3>
                    <span className="text-primary font-semibold whitespace-nowrap">{p.price}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="text-xs uppercase tracking-[0.4em] text-muted-foreground">{t("home_visit")}</div>
          <h2 className="text-4xl md:text-5xl mt-3" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
            <em className="italic text-primary">Hello.</em>
          </h2>
          <div className="mt-10 grid sm:grid-cols-3 gap-4 text-left">
            <a href="mailto:lekker.hcm@gmail.com" className="p-6 rounded-2xl bg-card border border-border hover:shadow-soft transition">
              <Mail className="w-5 h-5 text-primary" />
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-3">Email</div>
              <div className="font-medium mt-1 break-all">lekker.hcm@gmail.com</div>
            </a>
            <div className="p-6 rounded-2xl bg-card border border-border">
              <MapPin className="w-5 h-5 text-primary" />
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-3">Location</div>
              <div className="font-medium mt-1">{t("home_location")}</div>
            </div>
            <a href="https://www.instagram.com/lekker___1" target="_blank" rel="noreferrer" className="p-6 rounded-2xl bg-card border border-border hover:shadow-soft transition">
              <Instagram className="w-5 h-5 text-primary" />
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-3">Instagram</div>
              <div className="font-medium mt-1">@lekker___1</div>
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <img src={logo} alt="LEKKER" className="h-8 w-8 rounded-full object-cover" />
            <span>© {new Date().getFullYear()} LEKKER · {t("home_tagline")}</span>
          </div>
          <div>Crafted with <Heart className="inline w-3 h-3 fill-primary text-primary" /> in Al Hoceima</div>
        </div>
      </footer>
    </div>
  );
}
