import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Instagram, Mail, MapPin, Sparkles, Star, Leaf, Clock } from "lucide-react";
import logo from "@/assets/lekker-logo.jpg";
import crepeChoco from "@/assets/crepe-chocolate.jpg";
import crepePistachio from "@/assets/crepe-pistachio.jpg";
import juiceStrawberry from "@/assets/juice-strawberry.jpg";
import juiceMango from "@/assets/juice-mango.jpg";
import mojitoBlueberry from "@/assets/mojito-blueberry.jpg";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "LEKKER — Premium Crêpes, Juices & Mojitos · Al Hoceima" },
      {
        name: "description",
        content:
          "LEKKER — A luxury crêpe & drinks experience in Al Hoceima. Premium crêpes, fresh juices, mojitos and artisan ice cream. Un goût ♡ bonheur.",
      },
      { property: "og:title", content: "LEKKER — Un goût ♡ bonheur" },
      {
        property: "og:description",
        content: "Premium crêpes, fresh juices, mojitos & artisan ice cream in Al Hoceima.",
      },
    ],
  }),
});

type Product = {
  name: string;
  desc: string;
  price: string;
  img: string;
  tag?: string;
};

const categories: { id: string; label: string; icon: string; items: Product[] }[] = [
  {
    id: "crepes",
    label: "Crêpes",
    icon: "🥞",
    items: [
      { name: "Crêpe Nutella Royale", desc: "Nutella fondant, éclats de noisette, sucre glace.", price: "45 DH", img: crepeChoco, tag: "Bestseller" },
      { name: "Crêpe Pistachio Fraise", desc: "Crème de pistache, fraises fraîches, chocolat.", price: "55 DH", img: crepePistachio, tag: "Signature" },
      { name: "Crêpe Lotus Caramel", desc: "Pâte Lotus Biscoff, caramel beurre salé.", price: "50 DH" , img: crepeChoco },
      { name: "Crêpe Kinder Bueno", desc: "Crème Kinder, gaufrettes croustillantes.", price: "52 DH", img: crepePistachio },
    ],
  },
  {
    id: "juices",
    label: "Fresh Juices",
    icon: "🥭",
    items: [
      { name: "Mango Sunrise", desc: "Mangue Alphonso pressée, glace pilée.", price: "35 DH", img: juiceMango, tag: "Fresh" },
      { name: "Strawberry Bliss", desc: "Fraises fraîches, menthe, citron vert.", price: "32 DH", img: juiceStrawberry },
      { name: "Tropical Detox", desc: "Ananas, gingembre, citron, pomme verte.", price: "38 DH", img: juiceMango },
      { name: "Avocado Velvet", desc: "Avocat crémeux, lait d'amande, miel.", price: "40 DH", img: juiceStrawberry },
    ],
  },
  {
    id: "mojitos",
    label: "Mojitos",
    icon: "🌿",
    items: [
      { name: "Blueberry Mojito", desc: "Myrtilles, menthe fraîche, citron vert pétillant.", price: "42 DH", img: mojitoBlueberry, tag: "100% Gourmand" },
      { name: "Strawberry Mojito", desc: "Fraises mûres, menthe, eau gazeuse.", price: "40 DH", img: juiceStrawberry },
      { name: "Tropical Mojito", desc: "Mangue, ananas, citron vert, menthe.", price: "42 DH", img: juiceMango },
      { name: "Classic Mojito", desc: "La recette intemporelle, menthe & citron.", price: "38 DH", img: mojitoBlueberry },
    ],
  },
  {
    id: "icecream",
    label: "Ice Cream",
    icon: "🍦",
    items: [
      { name: "Pistache Artisanale", desc: "Glace pistache de Sicile, éclats torréfiés.", price: "30 DH", img: crepePistachio },
      { name: "Chocolat Noir 70%", desc: "Cacao Valrhona, intensité fondante.", price: "28 DH", img: crepeChoco },
      { name: "Vanille Bourbon", desc: "Gousses de vanille de Madagascar.", price: "26 DH", img: juiceMango },
      { name: "Lotus Caramel", desc: "Glace caramel, brisures Lotus.", price: "30 DH", img: crepeChoco },
    ],
  },
];

function Index() {
  const [active, setActive] = useState("crepes");
  const current = categories.find((c) => c.id === active)!;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-3">
            <img src={logo} alt="LEKKER" className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/20" />
            <div className="leading-tight">
              <div className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "'Cormorant Garamond',serif" }}>Lekker</div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Un goût ♡ bonheur</div>
            </div>
          </a>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a href="#menu" className="hover:text-primary transition-colors">Menu</a>
            <a href="#about" className="hover:text-primary transition-colors">About</a>
            <a href="#story" className="hover:text-primary transition-colors">Experience</a>
            <a href="#contact" className="hover:text-primary transition-colors">Contact</a>
          </nav>
          <a href="#menu" className="hidden md:inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition shadow-soft">
            <Heart className="w-4 h-4" /> Order Now
          </a>
        </div>
      </header>

      {/* HERO */}
      <section id="top" className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-24 md:pt-24 md:pb-32 grid md:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border text-xs uppercase tracking-widest text-muted-foreground mb-6">
              <Sparkles className="w-3.5 h-3.5" /> Al Hoceima · Morocco
            </div>
            <h1 className="text-5xl md:text-7xl font-semibold leading-[1.05] text-balance">
              A crêpe experience <em className="italic text-primary">beyond</em> expectations.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-lg">
              Every detail is crafted with love, with care and patience —
              so you get nothing but the best. Crêpes, juices, mojitos & artisan ice cream.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#menu" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 rounded-full font-medium shadow-luxe hover:scale-[1.02] transition">
                <Heart className="w-4 h-4" /> Explore the Menu
              </a>
              <a href="#story" className="inline-flex items-center gap-2 border border-primary/30 px-6 py-3.5 rounded-full font-medium hover:bg-card transition">
                Our Story
              </a>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5"><Star className="w-4 h-4 fill-accent text-accent" /> 100% Gourmand</div>
              <div className="flex items-center gap-1.5"><Leaf className="w-4 h-4" /> Fresh · Natural</div>
              <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Crafted daily</div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-10 bg-gradient-warm blur-3xl opacity-60 rounded-full" />
            <div className="relative animate-float">
              <img src={crepePistachio} alt="Signature pistachio crêpe" className="rounded-3xl shadow-luxe w-full object-cover aspect-[4/5]" />
              <div className="absolute -bottom-6 -left-6 bg-card border border-border rounded-2xl px-5 py-3 shadow-soft">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Signature</div>
                <div className="font-semibold">Crêpe Pistachio</div>
              </div>
              <div className="absolute -top-4 -right-4 bg-primary text-primary-foreground rounded-full h-20 w-20 grid place-items-center text-xs font-semibold text-center leading-tight shadow-luxe">
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
            <div className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Le Menu</div>
            <h2 className="text-4xl md:text-5xl mt-3">Crafted with love, <em className="italic text-primary">served with care</em></h2>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium border transition ${
                  active === c.id
                    ? "bg-primary text-primary-foreground border-primary shadow-soft"
                    : "bg-background border-border hover:border-primary/40"
                }`}
              >
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
                    <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full">
                      {p.tag}
                    </span>
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

      {/* STORY */}
      <section id="story" className="py-24">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div className="relative order-2 md:order-1">
            <img src={mojitoBlueberry} alt="Blueberry mojito" className="rounded-3xl shadow-luxe w-full object-cover aspect-[4/5]" />
          </div>
          <div className="order-1 md:order-2">
            <div className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Our Philosophy</div>
            <h2 className="text-4xl md:text-5xl mt-3">We're <em className="italic text-primary">taking our time</em></h2>
            <p className="mt-6 text-lg text-muted-foreground">
              At LEKKER, we believe the best moments are crafted slowly. Every crêpe is folded by hand,
              every juice pressed fresh, every mojito muddled with intent.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-2xl bg-card border border-border">
                <div className="text-3xl font-semibold text-primary">100%</div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Gourmand</div>
              </div>
              <div className="p-4 rounded-2xl bg-card border border-border">
                <div className="text-3xl font-semibold text-primary">Fresh</div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Daily</div>
              </div>
              <div className="p-4 rounded-2xl bg-card border border-border">
                <div className="text-3xl font-semibold text-primary">♡</div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">With Care</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT / VALUES */}
      <section id="about" className="py-24 bg-gradient-cocoa text-primary-foreground">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl text-balance">A goût ♡ of happiness, in every bite.</h2>
          <p className="mt-6 text-lg opacity-80 max-w-2xl mx-auto">
            From our kitchen in Al Hoceima to your moment of joy — LEKKER brings together
            premium ingredients, artisan technique, and a touch of Moroccan warmth.
          </p>
          <div className="mt-12 grid sm:grid-cols-3 gap-6">
            {[
              { t: "Artisan Crêpes", d: "Folded by hand, served warm." },
              { t: "Pressed Fresh", d: "Juices made the moment you order." },
              { t: "Pure Indulgence", d: "Ice cream churned in small batches." },
            ].map((v) => (
              <div key={v.t} className="p-6 rounded-2xl border border-primary-foreground/15 bg-primary-foreground/5 backdrop-blur">
                <h3 className="text-xl font-semibold">{v.t}</h3>
                <p className="mt-2 text-sm opacity-75">{v.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Visit us</div>
          <h2 className="text-4xl md:text-5xl mt-3">Come say <em className="italic text-primary">hello</em></h2>
          <div className="mt-10 grid sm:grid-cols-3 gap-4 text-left">
            <a href="mailto:lekker.hcm@gmail.com" className="p-6 rounded-2xl bg-card border border-border hover:shadow-soft transition">
              <Mail className="w-5 h-5 text-primary" />
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-3">Email</div>
              <div className="font-medium mt-1 break-all">lekker.hcm@gmail.com</div>
            </a>
            <div className="p-6 rounded-2xl bg-card border border-border">
              <MapPin className="w-5 h-5 text-primary" />
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-3">Location</div>
              <div className="font-medium mt-1">Al Hoceima, Morocco</div>
            </div>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="p-6 rounded-2xl bg-card border border-border hover:shadow-soft transition">
              <Instagram className="w-5 h-5 text-primary" />
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-3">Instagram</div>
              <div className="font-medium mt-1">@lekker.hcm</div>
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <img src={logo} alt="LEKKER" className="h-8 w-8 rounded-full object-cover" />
            <span>© {new Date().getFullYear()} LEKKER · Un goût ♡ bonheur</span>
          </div>
          <div>Crafted with ♡ in Al Hoceima</div>
        </div>
      </footer>
    </div>
  );
}
