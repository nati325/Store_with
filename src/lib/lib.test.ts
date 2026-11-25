import { test } from "node:test";
import assert from "node:assert/strict";
import { allow } from "./ratelimit";
import { csvCell, toCsv } from "./csv";

test("הגבלת קצב", () => {
  const t0 = 1_000_000;
  assert.ok(allow("k1", 2, 1000, t0));
  assert.ok(allow("k1", 2, 1000, t0 + 1));
  assert.ok(!allow("k1", 2, 1000, t0 + 2));
  assert.ok(allow("k1", 2, 1000, t0 + 1500));
});
test("CSV מגן מהזרקת נוסחאות ומטפל במרכאות", () => {
  assert.equal(csvCell("=1+1"), `"'=1+1"`);
  assert.equal(csvCell('a"b'), `"a""b"`);
  assert.ok(toCsv([["א", 1]]).startsWith("﻿"));
});

import { parseTiers, tiersToText, safeHttpsUrl } from "./tiers";
test("פירוק מדרגות מחיר", () => {
  assert.deepEqual(parseTiers("100:17, 50:20.5, x:1, 50:19"), [{ minQty: 50, unitPrice: 1900 }, { minQty: 100, unitPrice: 1700 }]);
  assert.equal(tiersToText(parseTiers("50:20, 100:17.5")), "50:20, 100:17.5");
});
test("קישור תשלום חייב להיות https", () => {
  assert.equal(safeHttpsUrl("javascript:alert(1)"), "");
  assert.equal(safeHttpsUrl("http://x.com"), "");
  assert.ok(safeHttpsUrl("https://pay.example.com/abc").startsWith("https://"));
});

import { safeUploadUrl, tokenOk, newToken } from "./orderMail";
test("כתובות העלאה תקינות בלבד", () => {
  assert.equal(safeUploadUrl("/api/uploads/0123456789abcdef01234567.png"), "/api/uploads/0123456789abcdef01234567.png");
  assert.equal(safeUploadUrl("https://evil.com/x.png"), "");
  assert.equal(safeUploadUrl("/api/uploads/../../etc/passwd"), "");
});
test("טוקן הזמנה", () => {
  const t = newToken();
  assert.equal(t.length, 32);
  assert.ok(tokenOk(t, t));
  assert.ok(!tokenOk("x", t));
  assert.ok(!tokenOk(undefined, t));
  assert.ok(!tokenOk(t, ""));
});


import { grossLines, buildCreateBody, verifyResult } from "./cardcom";
const cfg = { terminal: 1000, apiName: "demo", base: "https://x", docType: "TaxInvoiceAndReceipt" };
const ord = { number: "BS-1", token: "t".repeat(32), company: "אלפא", customerName: "דנה", taxId: "515", email: "a@b.co", phone: "05", address: "ת״א", total: 2407.2 * 100 | 0, items: [{ name: "ספל", qty: 120, unitPrice: 1700 }] };
test("שורות מסמך כולל מע״מ שסכומן שווה לסכום החיוב", () => {
  const items = [{ name: "א", qty: 33, unitPrice: 1234 }, { name: "ב", qty: 7, unitPrice: 999 }, { name: "ג", qty: 3, unitPrice: 1 }];
  const net = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const total = net + Math.round(net * 0.18);
  const lines = grossLines(items, total);
  assert.equal(Math.round(lines.reduce((s, l) => s + l.TotalLineCost * 100, 0)), total);
});
test("גוף בקשת Cardcom: סכום, החזרה, ומסמך", () => {
  const b: any = buildCreateBody({ ...ord, total: 240720 }, cfg, "https://shop.example");
  assert.equal(b.Amount, 2407.2);
  assert.equal(b.ReturnValue, "BS-1");
  assert.equal(b.Operation, "ChargeOnly");
  assert.ok(b.SuccessRedirectUrl.includes("/order/BS-1?t=") && b.SuccessRedirectUrl.endsWith("&paid=1"));
  assert.equal(b.WebHookUrl, "https://shop.example/api/webhooks/cardcom");
  assert.equal(b.Document.DocumentTypeToCreate, "TaxInvoiceAndReceipt");
  assert.equal(b.Document.Products[0].TotalLineCost, 2407.2);
  assert.equal(buildCreateBody({ ...ord, total: 240720 }, { ...cfg, docType: "" }, "https://s").Document, undefined);
});
test("אימות תשלום: רק תשלום מוצלח, להזמנה הנכונה ובסכום המדויק", () => {
  const good = { ResponseCode: 0, ReturnValue: "BS-1", TranzactionInfo: { ResponseCode: 0, Amount: 2407.2, CoinId: 1 }, DocumentInfo: { DocumentUrl: "https://inv/1", DocumentNumber: 77 } };
  const o = { number: "BS-1", total: 240720 };
  const v = verifyResult(good, o);
  assert.ok(v.ok && v.invoiceUrl === "https://inv/1" && v.invoiceNo === "77");
  assert.ok(!verifyResult({ ...good, ReturnValue: "BS-2" }, o).ok);
  assert.ok(!verifyResult({ ...good, TranzactionInfo: { ...good.TranzactionInfo, Amount: 1 } }, o).ok);
  assert.ok(!verifyResult({ ...good, TranzactionInfo: { ...good.TranzactionInfo, ResponseCode: 5 } }, o).ok);
  assert.ok(!verifyResult({ ...good, TranzactionInfo: { ...good.TranzactionInfo, CoinId: 2 } }, o).ok);
  assert.ok(!verifyResult({ ResponseCode: 0, ReturnValue: "BS-1" }, o).ok);
  assert.ok(!verifyResult(null, o).ok);
});
