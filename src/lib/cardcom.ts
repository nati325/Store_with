/**
 * חיבור ל-Cardcom (API v11) לפי המפרט הרשמי: https://secure.cardcom.solutions/swagger/v11/swagger.json
 * זרימה: LowProfile/Create יוצר דף תשלום מאובטח, הלקוח משלם אצל Cardcom,
 * ואנחנו מאמתים את התשלום בשרת מול LowProfile/GetLpResult (לא סומכים על ה-webhook לבד).
 */
import { db } from "./db";
import { sendMail, siteUrl } from "./mail";
import { formatILS } from "./pricing";
import { orderLink } from "./orderMail";

export type CardcomConfig = { terminal: number; apiName: string; base: string; docType: string };

export function cardcomConfig(): CardcomConfig | null {
  const terminal = parseInt(process.env.CARDCOM_TERMINAL || "", 10);
  const apiName = process.env.CARDCOM_API_NAME || "";
  if (!(terminal > 0) || !apiName) return null;
  return {
    terminal,
    apiName,
    base: (process.env.CARDCOM_BASE || "https://secure.cardcom.solutions").replace(/\/$/, ""),
    docType: process.env.CARDCOM_DOC_TYPE ?? "TaxInvoiceAndReceipt",
  };
}

type OrderLike = {
  number: string; token: string; company: string; customerName: string; taxId: string; email: string; phone: string; address: string;
  total: number; items: { name: string; qty: number; unitPrice: number }[];
};

const VAT = 0.18;

/** שורות מסמך כולל מע״מ, שסכומן שווה בדיוק לסכום החיוב (באגורות). */
export function grossLines(items: OrderLike["items"], total: number) {
  const gross = items.map((i) => Math.round(i.unitPrice * i.qty * (1 + VAT)));
  if (gross.length) gross[gross.length - 1] += total - gross.reduce((a, b) => a + b, 0);
  return items.map((i, idx) => ({
    Description: i.name,
    Quantity: i.qty,
    UnitCost: Math.round(gross[idx] / i.qty) / 100,
    TotalLineCost: gross[idx] / 100,
  }));
}

export function buildCreateBody(o: OrderLike, cfg: CardcomConfig, site: string) {
  const back = `${site}/order/${o.number}?t=${o.token}`;
  return {
    TerminalNumber: cfg.terminal,
    ApiName: cfg.apiName,
    Operation: "ChargeOnly",
    ReturnValue: o.number,
    Amount: o.total / 100,
    ISOCoinId: 1,
    Language: "he",
    ProductName: `הזמנה ${o.number}`,
    SuccessRedirectUrl: `${back}&paid=1`,
    FailedRedirectUrl: `${back}&paid=0`,
    CancelRedirectUrl: `${back}&paid=0`,
    WebHookUrl: `${site}/api/webhooks/cardcom`,
    UIDefinition: { CardOwnerNameValue: o.customerName, CardOwnerEmailValue: o.email, CardOwnerPhoneValue: o.phone, IsCardOwnerEmailRequired: true },
    ...(cfg.docType
      ? {
          Document: {
            DocumentTypeToCreate: cfg.docType,
            Name: o.company,
            ...(o.taxId ? { TaxId: o.taxId } : {}),
            Email: o.email,
            IsSendByEmail: true,
            Phone: o.phone,
            AddressLine1: o.address,
            Comments: `הזמנה ${o.number}`,
            Products: grossLines(o.items, o.total),
          },
        }
      : {}),
  };
}

async function call<T>(cfg: CardcomConfig, path: string, body: unknown): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(`${cfg.base}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal: ctrl.signal });
    if (!res.ok) throw new Error(`Cardcom HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

export async function createPayment(o: OrderLike): Promise<{ url: string; lowProfileId: string }> {
  const cfg = cardcomConfig();
  if (!cfg) throw new Error("Cardcom לא מוגדר");
  const r = await call<{ ResponseCode: number; Description?: string; LowProfileId?: string; Url?: string }>(cfg, "/api/v11/LowProfile/Create", buildCreateBody(o, cfg, siteUrl()));
  if (r.ResponseCode !== 0 || !r.Url || !r.LowProfileId) throw new Error(`Cardcom Create נכשל: ${r.ResponseCode} ${r.Description ?? ""}`);
  return { url: r.Url, lowProfileId: r.LowProfileId };
}

export async function getResult(lowProfileId: string) {
  const cfg = cardcomConfig();
  if (!cfg) throw new Error("Cardcom לא מוגדר");
  return call<any>(cfg, "/api/v11/LowProfile/GetLpResult", { TerminalNumber: cfg.terminal, ApiName: cfg.apiName, LowProfileId: lowProfileId });
}

export type Verified = { ok: true; amount: number; invoiceUrl: string; invoiceNo: string } | { ok: false; reason: string };

/** בודק שהתשלום באמת הושלם, שייך להזמנה הזו, ובסכום המדויק שלה. */
export function verifyResult(r: any, o: { number: string; total: number }): Verified {
  if (!r || r.ResponseCode !== 0) return { ok: false, reason: `ResponseCode ${r?.ResponseCode}` };
  const t = r.TranzactionInfo;
  if (!t || t.ResponseCode !== 0) return { ok: false, reason: "no successful transaction" };
  if (r.ReturnValue !== o.number) return { ok: false, reason: "order mismatch" };
  if (typeof t.Amount !== "number" || Math.round(t.Amount * 100) !== o.total) return { ok: false, reason: "amount mismatch" };
  if (t.CoinId !== undefined && t.CoinId !== null && t.CoinId !== 1) return { ok: false, reason: "currency mismatch" };
  const d = r.DocumentInfo;
  return { ok: true, amount: o.total, invoiceUrl: String(d?.DocumentUrl || t.DocumentUrl || ""), invoiceNo: String(d?.DocumentNumber ?? t.DocumentNumber ?? "") };
}

/** מאמת מול Cardcom ומעדכן את ההזמנה אם שולמה. בטוח להרצה חוזרת, ושולח התראות פעם אחת בלבד. */
export async function syncPayment(orderId: number): Promise<"paid" | "pending" | "unconfigured" | "error"> {
  if (!cardcomConfig()) return "unconfigured";
  const o = await db.order.findUnique({ where: { id: orderId } });
  if (!o || !o.lowProfileId) return "pending";
  if (o.paidAt) return "paid";
  let v: Verified;
  try {
    v = verifyResult(await getResult(o.lowProfileId), o);
  } catch (e) {
    console.error("[cardcom] verify failed", e);
    return "error";
  }
  if (!v.ok) return "pending";
  // רישום התשלום ועדכון הסטטוס בטרנזקציה אחת, כדי שאף קורא לא יראה מצב ביניים (webhook וחזרת הדפדפן רצים במקביל)
  const [first] = await db.$transaction([
    db.order.updateMany({ where: { id: o.id, paidAt: null }, data: { paidAt: new Date(), paidAmount: v.amount, invoiceUrl: v.invoiceUrl, invoiceNo: v.invoiceNo } }),
    db.order.updateMany({ where: { id: o.id, status: { in: ["NEW", "CONFIRMED"] } }, data: { status: "PAID" } }),
  ]);
  if (first.count === 1) {
    await Promise.all([
      sendMail({ to: o.email, subject: `התשלום על הזמנה ${o.number} התקבל`, text: `שלום ${o.customerName},\n\nהתשלום בסך ${formatILS(v.amount)} התקבל, תודה.${v.invoiceUrl ? `\nהחשבונית: ${v.invoiceUrl}` : ""}\n\nמעקב ופרטים: ${orderLink(o)}` }),
      sendMail({ to: process.env.ADMIN_EMAIL || "", subject: `התקבל תשלום: ${o.number} (${o.company})`, text: `${formatILS(v.amount)} שולמו בכרטיס אשראי.\n${siteUrl()}/admin/orders/${o.id}` }),
    ]);
  }
  return "paid";
}
