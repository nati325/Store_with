import { test } from "node:test";
import assert from "node:assert/strict";
import { unitPriceFor, totals } from "./pricing";

const tiers = [
  { minQty: 50, unitPrice: 900 },
  { minQty: 100, unitPrice: 800 },
];

test("מחיר בסיס מתחת למדרגה הראשונה", () => {
  assert.equal(unitPriceFor(1000, tiers, 49), 1000);
});
test("מדרגות לפי כמות", () => {
  assert.equal(unitPriceFor(1000, tiers, 50), 900);
  assert.equal(unitPriceFor(1000, tiers, 99), 900);
  assert.equal(unitPriceFor(1000, tiers, 100), 800);
  assert.equal(unitPriceFor(1000, tiers, 500), 800);
});
test("מע\"מ 18%", () => {
  assert.deepEqual(totals(10000), { subtotal: 10000, vat: 1800, total: 11800 });
});
