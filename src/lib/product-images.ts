// Premium product images mapping
import crepeNutella from "@/assets/products/crepe-nutella.jpg";
import crepePistachio from "@/assets/products/crepe-pistachio-premium.jpg";
import crepeLotus from "@/assets/products/crepe-lotus.jpg";
import crepeStrawberry from "@/assets/products/crepe-strawberry.jpg";
import juiceMango from "@/assets/products/juice-mango-premium.jpg";
import juiceStrawberry from "@/assets/products/juice-strawberry-premium.jpg";
import juiceOrange from "@/assets/products/juice-orange.jpg";
import mojitoClassic from "@/assets/products/mojito-classic.jpg";
import mojitoStrawberry from "@/assets/products/mojito-strawberry.jpg";
import mojitoTropical from "@/assets/products/mojito-tropical.jpg";
import icePistachio from "@/assets/products/icecream-pistachio.jpg";
import iceVanilla from "@/assets/products/icecream-vanilla.jpg";
import iceChocolate from "@/assets/products/icecream-chocolate.jpg";
import drinkCappuccino from "@/assets/products/drink-cappuccino.jpg";
import drinkHotChoc from "@/assets/products/drink-hotchoc.jpg";
import drinkMilkshake from "@/assets/products/drink-milkshake.jpg";
import dessertTiramisu from "@/assets/products/dessert-tiramisu.jpg";
import dessertCheesecake from "@/assets/products/dessert-cheesecake.jpg";
import dessertWaffle from "@/assets/products/dessert-waffle.jpg";
import dessertFondant from "@/assets/products/dessert-fondant.jpg";

const exact: Record<string, string> = {
  // crepes
  "Nutella Supreme": crepeNutella,
  "Ferrero Deluxe": crepeNutella,
  "Pistachio Royal": crepePistachio,
  "Lotus Crunch": crepeLotus,
  "Kinder Dream": crepeLotus,
  "Strawberry Heaven": crepeStrawberry,
  "Red Velvet Crepe": crepeStrawberry,
  "Banana Caramel": crepeLotus,
  "Oreo Explosion": crepeNutella,
  "White Chocolate Bliss": crepePistachio,
  "Protein Power Crepe": crepePistachio,
  "Signature LEKKER Special": crepeNutella,
  // juices
  "Mango Madness": juiceMango,
  "Tropical Mix": juiceMango,
  "Pineapple Boost": juiceMango,
  "Strawberry Fresh": juiceStrawberry,
  "Mixed Berry Juice": juiceStrawberry,
  "Fresh Orange Juice": juiceOrange,
  "Vitamin Energy": juiceOrange,
  "Detox Green": mojitoClassic,
  "Avocado Smoothie": juiceStrawberry,
  "Kiwi Fresh": mojitoClassic,
  // mojitos
  "Classic Mojito": mojitoClassic,
  "Lemon Mint": mojitoClassic,
  "Strawberry Mojito": mojitoStrawberry,
  "Watermelon Fresh": mojitoStrawberry,
  "Tropical Mojito": mojitoTropical,
  "Passion Fruit Mojito": mojitoTropical,
  "Frozen Mojito": mojitoClassic,
  "Blue Lagoon": mojitoTropical,
  // icecream
  "Pistachio Premium": icePistachio,
  "Vanilla Classic": iceVanilla,
  "Salted Caramel": iceVanilla,
  "Belgian Chocolate": iceChocolate,
  "Oreo Crunch": iceChocolate,
  "Lotus Cream": iceVanilla,
  "Mango Sorbet": juiceMango,
  "Strawberry Gelato": mojitoStrawberry,
  "Signature Mix": icePistachio,
  // drinks
  "Cappuccino": drinkCappuccino,
  "Latte": drinkCappuccino,
  "Espresso": drinkCappuccino,
  "Iced Coffee": drinkCappuccino,
  "Matcha Latte": drinkCappuccino,
  "Hot Chocolate": drinkHotChoc,
  "Chocolate Milkshake": drinkMilkshake,
  "Vanilla Milkshake": drinkMilkshake,
  // desserts
  "Tiramisu": dessertTiramisu,
  "Cheesecake": dessertCheesecake,
  "Waffle Supreme": dessertWaffle,
  "Pancake Tower": dessertWaffle,
  "Brownie Deluxe": dessertFondant,
  "Chocolate Fondant": dessertFondant,
};

const fallback: Record<string, string> = {
  crepes: crepeNutella,
  juices: juiceMango,
  mojitos: mojitoClassic,
  icecream: iceVanilla,
  drinks: drinkCappuccino,
  desserts: dessertTiramisu,
};

export function getProductImage(name: string, category: string): string {
  return exact[name] ?? fallback[category] ?? crepeNutella;
}
