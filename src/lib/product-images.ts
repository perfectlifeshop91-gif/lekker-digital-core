import crepeChoco from "@/assets/crepe-chocolate.jpg";
import crepePistachio from "@/assets/crepe-pistachio.jpg";
import juiceMango from "@/assets/juice-mango.jpg";
import juiceStrawberry from "@/assets/juice-strawberry.jpg";
import mojitoBlueberry from "@/assets/mojito-blueberry.jpg";

const map: Record<string, string> = {
  "Crêpe Nutella Royale": crepeChoco,
  "Crêpe Pistachio Fraise": crepePistachio,
  "Crêpe Lotus Caramel": crepeChoco,
  "Crêpe Kinder Bueno": crepePistachio,
  "Mango Sunrise": juiceMango,
  "Strawberry Bliss": juiceStrawberry,
  "Tropical Detox": juiceMango,
  "Avocado Velvet": juiceStrawberry,
  "Blueberry Mojito": mojitoBlueberry,
  "Strawberry Mojito": juiceStrawberry,
  "Tropical Mojito": juiceMango,
  "Classic Mojito": mojitoBlueberry,
  "Pistache Artisanale": crepePistachio,
  "Chocolat Noir 70%": crepeChoco,
  "Vanille Bourbon": juiceMango,
  "Lotus Caramel": crepeChoco,
};

const fallback: Record<string, string> = {
  crepes: crepeChoco,
  juices: juiceMango,
  mojitos: mojitoBlueberry,
  icecream: crepePistachio,
};

export function getProductImage(name: string, category: string): string {
  return map[name] ?? fallback[category] ?? crepeChoco;
}
