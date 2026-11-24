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
