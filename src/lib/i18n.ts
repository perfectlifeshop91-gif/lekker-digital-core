// Multilingual support for LEKKER (FR, AR, Tarifit/Berber, EN, ES)
import { useEffect, useState } from "react";

export type Lang = "fr" | "ar" | "ber" | "en" | "es";

export const LANGS: { code: Lang; label: string; flag: string; rtl?: boolean }[] = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "ar", label: "العربية", flag: "🇲🇦", rtl: true },
  { code: "ber", label: "ⵜⴰⵔⵉⴼⵉⵜ", flag: "ⵣ", rtl: false },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
];

type Dict = Record<string, Record<Lang, string>>;

export const T: Dict = {
  // Receipt / ticket
  ticket: { fr: "Ticket", ar: "تذكرة", ber: "Tikkit", en: "Receipt", es: "Recibo" },
  kitchen: { fr: "CUISINE", ar: "المطبخ", ber: "AKUZIN", en: "KITCHEN", es: "COCINA" },
  table: { fr: "Table", ar: "طاولة", ber: "Ṭabla", en: "Table", es: "Mesa" },
  takeaway: { fr: "À emporter", ar: "للأخذ", ber: "Awi yidek", en: "Take away", es: "Para llevar" },
  customer: { fr: "Client", ar: "الزبون", ber: "Amsaɣ", en: "Customer", es: "Cliente" },
  waiter: { fr: "Serveur", ar: "النادل", ber: "Aqeddac", en: "Waiter", es: "Camarero" },
  subtotal: { fr: "Sous-total", ar: "المجموع الفرعي", ber: "Asemday amezwaru", en: "Subtotal", es: "Subtotal" },
  discount: { fr: "Remise", ar: "خصم", ber: "Asenqes", en: "Discount", es: "Descuento" },
  tax: { fr: "TVA", ar: "ضريبة", ber: "Tabzert", en: "Tax", es: "IVA" },
  tip: { fr: "Pourboire", ar: "بقشيش", ber: "Lḥeqq", en: "Tip", es: "Propina" },
  total: { fr: "TOTAL", ar: "المجموع", ber: "ASEMDAY", en: "TOTAL", es: "TOTAL" },
  payment: { fr: "Paiement", ar: "الدفع", ber: "Axelles", en: "Payment", es: "Pago" },
  cash: { fr: "Espèces", ar: "نقدا", ber: "S idrimen", en: "Cash", es: "Efectivo" },
  card: { fr: "Carte", ar: "بطاقة", ber: "Takarṭ", en: "Card", es: "Tarjeta" },
  transfer: { fr: "Virement", ar: "تحويل", ber: "Tisifeḍt", en: "Transfer", es: "Transferencia" },
  notes: { fr: "Notes", ar: "ملاحظات", ber: "Tizmilin", en: "Notes", es: "Notas" },
  thanks: {
    fr: "Merci d'avoir choisi LEKKER ❤",
    ar: "شكرا لاختياركم لكر ❤",
    ber: "Tanemmirt i kenwi ɣef LEKKER ❤",
    en: "Thank you for choosing LEKKER ❤",
    es: "Gracias por elegir LEKKER ❤",
  },
  comeBack: {
    fr: "Au plaisir de vous revoir bientôt.",
    ar: "نتطلع لرؤيتكم قريبا",
    ber: "Ad nemmager tikelt nniḍen",
    en: "We look forward to seeing you again.",
    es: "Esperamos verle pronto de nuevo.",
  },
  endOrder: { fr: "FIN COMMANDE", ar: "نهاية الطلب", ber: "TAGGARA N USURIF", en: "END OF ORDER", es: "FIN DEL PEDIDO" },
  // UI
  pos: { fr: "Caisse", ar: "الصندوق", ber: "Tasenduqt", en: "POS", es: "Caja" },
  orders: { fr: "Commandes", ar: "الطلبات", ber: "Isuraf", en: "Orders", es: "Pedidos" },
  products: { fr: "Produits", ar: "المنتجات", ber: "Ifariden", en: "Products", es: "Productos" },
  analytics: { fr: "Analytique", ar: "التحليلات", ber: "Tasleḍt", en: "Analytics", es: "Analíticas" },
  staff: { fr: "Personnel", ar: "الموظفين", ber: "Ixeddamen", en: "Staff", es: "Personal" },
  ai: { fr: "Assistant IA", ar: "مساعد الذكاء", ber: "Amellal IA", en: "AI Assistant", es: "Asistente IA" },
  language: { fr: "Langue", ar: "اللغة", ber: "Tutlayt", en: "Language", es: "Idioma" },
  cart: { fr: "Panier", ar: "السلة", ber: "Aqraf", en: "Cart", es: "Carrito" },
  checkout: { fr: "Encaisser & Imprimer", ar: "الدفع والطباعة", ber: "Xelles & Siggeḍ", en: "Checkout & Print", es: "Pagar e Imprimir" },
  search: { fr: "Rechercher…", ar: "بحث…", ber: "Nadi…", en: "Search…", es: "Buscar…" },
  all: { fr: "Tout", ar: "الكل", ber: "Akk", en: "All", es: "Todo" },
  // Home page
  home_menu: { fr: "Menu", ar: "القائمة", ber: "Umuɣ", en: "Menu", es: "Menú" },
  home_about: { fr: "À propos", ar: "عن", ber: "Ɣef", en: "About", es: "Acerca" },
  home_experience: { fr: "Expérience", ar: "تجربة", ber: "Tirmit", en: "Experience", es: "Experiencia" },
  home_contact: { fr: "Contact", ar: "تواصل", ber: "Anermes", en: "Contact", es: "Contacto" },
  home_order: { fr: "Commander", ar: "اطلب الآن", ber: "Suter", en: "Order now", es: "Pedir" },
  home_pos: { fr: "Caisse", ar: "الصندوق", ber: "Tasenduqt", en: "POS", es: "Caja" },
  home_home: { fr: "Accueil", ar: "الرئيسية", ber: "Agejdan", en: "Home", es: "Inicio" },
  home_kitchen: { fr: "Cuisine", ar: "المطبخ", ber: "Akuzin", en: "Kitchen", es: "Cocina" },
  home_waiter: { fr: "Serveur", ar: "النادل", ber: "Aqeddac", en: "Waiter", es: "Camarero" },
  home_admin: { fr: "Admin", ar: "المدير", ber: "Anebdad", en: "Admin", es: "Admin" },
  home_tagline: { fr: "Un goût ♡ bonheur", ar: "مذاق ♡ السعادة", ber: "Aẓri ♡ n lferḥ", en: "A taste ♡ of happiness", es: "Un sabor ♡ de felicidad" },
  home_location: { fr: "Al Hoceima · Maroc", ar: "الحسيمة · المغرب", ber: "Al Hoceima · Lmerruk", en: "Al Hoceima · Morocco", es: "Alhucemas · Marruecos" },
  home_hero_sweet: { fr: "Douceur,", ar: "حلاوة،", ber: "Tizidert,", en: "Sweetness,", es: "Dulzura," },
  home_hero_refined: { fr: "raffinée.", ar: "راقية.", ber: "izewren.", en: "refined.", es: "refinada." },
  home_hero_desc: {
    fr: "Crêpes artisanales, jus frais, mojitos signature et glaces — façonnés avec obsession chez LEKKER.",
    ar: "كريب حرفي، عصائر طازجة، موهيتو مميز وآيس كريم — مصنوعة بشغف في لكر.",
    ber: "Krip n ufus, lɛaṣir d ifessuyen, mojito n usaragu d glas — s tayri ɣer LEKKER.",
    en: "Artisan crêpes, fresh juices, signature mojitos and gelato — crafted with obsession at LEKKER.",
    es: "Crêpes artesanales, zumos frescos, mojitos exclusivos y helados — elaborados con obsesión en LEKKER.",
  },
  home_explore: { fr: "Explorer le menu", ar: "استكشف القائمة", ber: "Snirem umuɣ", en: "Explore the menu", es: "Explorar el menú" },
  home_open_pos: { fr: "Ouvrir le POS", ar: "فتح الصندوق", ber: "Ldi POS", en: "Open POS", es: "Abrir POS" },
  home_story_title: { fr: "Notre histoire", ar: "قصتنا", ber: "Tadyant nneɣ", en: "Our Story", es: "Nuestra historia" },
  home_visit: { fr: "Venez nous voir", ar: "تفضلوا بزيارتنا", ber: "Ɛiwed-aɣ-d", en: "Come say hello", es: "Ven a saludarnos" },
  home_cat_crepes: { fr: "Crêpes", ar: "كريب", ber: "Krip", en: "Crêpes", es: "Crêpes" },
  home_cat_juices: { fr: "Jus frais", ar: "عصائر", ber: "Lɛaṣir", en: "Fresh juices", es: "Zumos" },
  home_cat_mojitos: { fr: "Mojitos", ar: "موهيتو", ber: "Mojito", en: "Mojitos", es: "Mojitos" },
  home_cat_icecream: { fr: "Glaces", ar: "آيس كريم", ber: "Glas", en: "Ice cream", es: "Helados" },
  home_menu_title: { fr: "Le Menu", ar: "القائمة", ber: "Umuɣ", en: "The Menu", es: "El Menú" },
  home_menu_sub: { fr: "Façonné avec amour, servi avec soin", ar: "مصنوع بحب ويقدم بعناية", ber: "S tayri, s leɛnaya", en: "Crafted with love, served with care", es: "Hecho con amor, servido con cuidado" },
  ai_greeting: { fr: "👋 Bonjour ! Posez-moi vos questions :", ar: "👋 مرحبا ! اطرح أسئلتك :", ber: "👋 Azul ! Suter-aɣ-d :", en: "👋 Hi! Ask me anything:", es: "👋 ¡Hola! Pregúntame lo que quieras:" },
  ai_placeholder: { fr: "Posez votre question…", ar: "اطرح سؤالك…", ber: "Suter…", en: "Ask your question…", es: "Haz tu pregunta…" },
  ai_subtitle: { fr: "Recommandations & analyse", ar: "توصيات وتحليل", ber: "Tismilin & tasleḍt", en: "Recommendations & analysis", es: "Recomendaciones y análisis" },
};

const KEY = "lekker.lang";

export function getLang(): Lang {
  if (typeof window === "undefined") return "fr";
  return ((localStorage.getItem(KEY) as Lang) || "fr");
}

export function setLang(l: Lang) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, l);
  window.dispatchEvent(new CustomEvent("lekker-lang", { detail: l }));
}

export function useLang() {
  const [lang, setLangState] = useState<Lang>("fr");
  useEffect(() => {
    setLangState(getLang());
    const h = (e: Event) => setLangState((e as CustomEvent).detail);
    window.addEventListener("lekker-lang", h);
    return () => window.removeEventListener("lekker-lang", h);
  }, []);
  const t = (key: keyof typeof T) => T[key]?.[lang] ?? T[key]?.fr ?? key;
  const dir = LANGS.find(l => l.code === lang)?.rtl ? "rtl" : "ltr";
  return { lang, setLang, t, dir };
}

export function tr(key: keyof typeof T, lang: Lang): string {
  return T[key]?.[lang] ?? T[key]?.fr ?? (key as string);
}
