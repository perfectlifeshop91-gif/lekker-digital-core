// Dual ticket printing system: kitchen ticket + customer receipt
// Multilingual customer receipt (FR/AR/BER/EN/ES). Kitchen ticket stays FR for staff.
import { tr, type Lang, LANGS } from "@/lib/i18n";

export type PrintItem = {
  name: string;
  qty: number;
  price: number;
  notes?: string | null;
};

export type ReceiptData = {
  orderNumber: number;
  items: PrintItem[];
  subtotal: number;
  tax: number;
  discount?: number;
  tip?: number;
  total: number;
  payment: string;
  tableNumber?: string;
  customer?: string;
  waiterName?: string;
  notes?: string;
  date: Date;
  logoUrl?: string;
  lang?: Lang;
};

const baseStyles = `
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; padding: 8px 10px; color: #000; margin: 0; width: 80mm; font-size: 12px; }
  body.rtl { direction: rtl; text-align: right; }
  h1 { font-size: 22px; margin: 4px 0; text-align: center; letter-spacing: 4px; font-weight: 800; }
  h2 { font-size: 14px; margin: 2px 0; text-align: center; font-weight: 600; }
  .ctr { text-align: center; }
  .row { display: flex; justify-content: space-between; align-items: baseline; gap: 6px; }
  .sep { border-top: 1px dashed #000; margin: 8px 0; }
  .ssep { border-top: 1px solid #000; margin: 6px 0; }
  .small { font-size: 10px; color: #333; }
  .big { font-size: 16px; font-weight: 700; }
  .huge { font-size: 24px; font-weight: 800; letter-spacing: 1px; }
  .item { margin: 4px 0; }
  .qty-box { display: inline-block; min-width: 28px; padding: 2px 6px; border: 1.5px solid #000; text-align: center; font-weight: 700; margin-right: 6px; }
  .note { font-size: 11px; font-style: italic; padding-left: 36px; color: #444; }
  .logo { width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 4px; display: block; object-fit: cover; }
  .qr { display: block; margin: 8px auto; }
  .footer-msg { text-align: center; font-size: 11px; line-height: 1.5; margin-top: 6px; }
  .brand { font-family: 'Cormorant Garamond', Georgia, serif; }
`;

function openPrintWindow(title: string, html: string, rtl = false) {
  const w = window.open("", "_blank", "width=380,height=720");
  if (!w) return;
  const cls = rtl ? "rtl" : "";
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>${baseStyles}</style></head><body class="${cls}">${html}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); setTimeout(() => w.close(), 300); }, 250);
}

export function printKitchenTicket(d: ReceiptData) {
  // Kitchen ticket always in FR for staff consistency
  const time = d.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const html = `
    <h2 class="brand">CUISINE · KITCHEN</h2>
    <div class="ctr huge">#${d.orderNumber}</div>
    <div class="ssep"></div>
    <div class="row big">
      <span>${d.tableNumber ? "Table " + d.tableNumber : "À emporter"}</span>
      <span>${time}</span>
    </div>
    ${d.waiterName ? `<div class="small">Serveur: ${d.waiterName}</div>` : ""}
    ${d.customer ? `<div class="small">Client: ${d.customer}</div>` : ""}
    <div class="sep"></div>
    ${d.items.map(i => `
      <div class="item">
        <div class="big"><span class="qty-box">${i.qty}</span>${i.name}</div>
        ${i.notes ? `<div class="note">★ ${i.notes}</div>` : ""}
      </div>
    `).join("")}
    ${d.notes ? `<div class="sep"></div><div class="big">⚠ NOTES:</div><div>${d.notes}</div>` : ""}
    <div class="sep"></div>
    <div class="ctr small">--- FIN COMMANDE ---</div>
  `;
  openPrintWindow(`Cuisine #${d.orderNumber}`, html);
}

export function printCustomerReceipt(d: ReceiptData) {
  const lang: Lang = d.lang ?? "fr";
  const rtl = LANGS.find(l => l.code === lang)?.rtl ?? false;
  const t = (k: Parameters<typeof tr>[0]) => tr(k, lang);
  const qrData = encodeURIComponent(`LEKKER#${d.orderNumber}`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${qrData}`;
  const payLabel = d.payment === "cash" ? t("cash") : d.payment === "card" ? t("card") : t("transfer");
  const html = `
    ${d.logoUrl ? `<img src="${d.logoUrl}" class="logo" alt="LEKKER" />` : ""}
    <h1 class="brand">LEKKER</h1>
    <div class="ctr small">Crêpes · Jus · Mojitos</div>
    <div class="ctr small">Al Hoceima · Morocco</div>
    <div class="sep"></div>
    <div class="row"><span>${t("ticket")}</span><span class="big">#${d.orderNumber}</span></div>
    <div class="row small"><span>${d.date.toLocaleString()}</span></div>
    ${d.tableNumber ? `<div class="row small"><span>${t("table")}</span><span>${d.tableNumber}</span></div>` : ""}
    ${d.customer ? `<div class="row small"><span>${t("customer")}</span><span>${d.customer}</span></div>` : ""}
    ${d.waiterName ? `<div class="row small"><span>${t("waiter")}</span><span>${d.waiterName}</span></div>` : ""}
    <div class="sep"></div>
    ${d.items.map(i => `
      <div class="item">
        <div class="row"><span>${i.qty} × ${i.name}</span><span>${(i.price * i.qty).toFixed(2)}</span></div>
        ${i.notes ? `<div class="note">${i.notes}</div>` : ""}
      </div>
    `).join("")}
    <div class="sep"></div>
    <div class="row"><span>${t("subtotal")}</span><span>${d.subtotal.toFixed(2)} DH</span></div>
    ${d.discount ? `<div class="row"><span>${t("discount")}</span><span>-${d.discount.toFixed(2)} DH</span></div>` : ""}
    ${d.tax ? `<div class="row"><span>${t("tax")}</span><span>${d.tax.toFixed(2)} DH</span></div>` : ""}
    ${d.tip ? `<div class="row"><span>${t("tip")}</span><span>${d.tip.toFixed(2)} DH</span></div>` : ""}
    <div class="ssep"></div>
    <div class="row big"><span>${t("total")}</span><span>${d.total.toFixed(2)} DH</span></div>
    <div class="row small"><span>${t("payment")}</span><span>${payLabel}</span></div>
    <img src="${qrUrl}" class="qr" alt="QR" />
    <div class="footer-msg">
      <div style="font-weight:700; font-size:13px;" class="brand">${t("thanks")}</div>
      <div>${t("comeBack")}</div>
    </div>
    <div class="sep"></div>
    <div class="ctr small">
      📷 @lekker___1<br/>
      📍 Al Hoceima, Morocco
    </div>
  `;
  openPrintWindow(`Ticket #${d.orderNumber}`, html, rtl);
}

export function printBoth(d: ReceiptData) {
  printKitchenTicket(d);
  setTimeout(() => printCustomerReceipt(d), 800);
}
