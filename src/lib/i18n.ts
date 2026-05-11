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
