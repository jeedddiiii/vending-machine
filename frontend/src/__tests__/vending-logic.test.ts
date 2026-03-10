/**
 * Vending Machine Business Logic Tests
 *
 * Tests the pure client-side logic used in the vending machine UI:
 * - Credit calculation from inserted denominations
 * - Stock status badge determination
 * - Currency denomination classification
 * - Purchase request payload construction
 */

import { InsertedMoney } from "@/types";

// ---- Helper functions mirroring page.tsx logic ----

function calculateCredit(insertedMoney: InsertedMoney): number {
  return Object.entries(insertedMoney).reduce(
    (sum, [denom, count]) => sum + Number(denom) * count,
    0
  );
}

function getStockStatus(qty: number): { label: string; cls: string } {
  if (qty <= 0) return { label: "Out of Stock", cls: "no-stock" };
  if (qty <= 3) return { label: `${qty} left`, cls: "low-stock" };
  return { label: `${qty} in stock`, cls: "in-stock" };
}

function buildInsertedMoneyPayload(
  insertedMoney: InsertedMoney
): [number, number][] {
  return Object.entries(insertedMoney)
    .filter(([, c]) => c > 0)
    .map(([d, c]) => [Number(d), c]);
}

const VALID_DENOMINATIONS = [1, 5, 10, 20, 50, 100, 500, 1000];

function isValidDenomination(value: number): boolean {
  return VALID_DENOMINATIONS.includes(value);
}

// ---- Tests ----

describe("Credit Calculation", () => {
  test("empty inserted money equals zero credit", () => {
    expect(calculateCredit({})).toBe(0);
  });

  test("single coin insertion", () => {
    expect(calculateCredit({ 10: 1 })).toBe(10);
  });

  test("multiple same denomination coins", () => {
    expect(calculateCredit({ 5: 4 })).toBe(20);
  });

  test("mixed denominations", () => {
    expect(calculateCredit({ 100: 1, 50: 1, 10: 2 })).toBe(170);
  });

  test("all denominations combined", () => {
    const all: InsertedMoney = {
      1: 1,
      5: 1,
      10: 1,
      20: 1,
      50: 1,
      100: 1,
      500: 1,
      1000: 1,
    };
    expect(calculateCredit(all)).toBe(1686);
  });

  test("large note quantity", () => {
    expect(calculateCredit({ 1000: 5 })).toBe(5000);
  });
});

describe("Stock Status", () => {
  test("zero stock shows out of stock", () => {
    const status = getStockStatus(0);
    expect(status.label).toBe("Out of Stock");
    expect(status.cls).toBe("no-stock");
  });

  test("negative stock shows out of stock", () => {
    const status = getStockStatus(-1);
    expect(status.label).toBe("Out of Stock");
    expect(status.cls).toBe("no-stock");
  });

  test("low stock (1-3) shows warning", () => {
    const status = getStockStatus(2);
    expect(status.label).toBe("2 left");
    expect(status.cls).toBe("low-stock");
  });

  test("boundary: 3 items is low stock", () => {
    const status = getStockStatus(3);
    expect(status.cls).toBe("low-stock");
  });

  test("boundary: 4 items is in stock", () => {
    const status = getStockStatus(4);
    expect(status.cls).toBe("in-stock");
  });

  test("high stock shows in stock", () => {
    const status = getStockStatus(20);
    expect(status.label).toBe("20 in stock");
    expect(status.cls).toBe("in-stock");
  });
});

describe("Denomination Validation", () => {
  test.each(VALID_DENOMINATIONS)("accepts valid denomination: %i", (d) => {
    expect(isValidDenomination(d)).toBe(true);
  });

  test.each([0, 2, 3, 7, 15, 25, 200, 2000])(
    "rejects invalid denomination: %i",
    (d) => {
      expect(isValidDenomination(d)).toBe(false);
    }
  );
});

describe("Purchase Payload Construction", () => {
  test("empty money produces empty payload", () => {
    expect(buildInsertedMoneyPayload({})).toEqual([]);
  });

  test("filters out zero-count entries", () => {
    const payload = buildInsertedMoneyPayload({ 10: 0, 50: 2 });
    expect(payload).toEqual([[50, 2]]);
  });

  test("converts correctly to tuple format", () => {
    const payload = buildInsertedMoneyPayload({ 100: 1, 20: 3 });
    expect(payload).toContainEqual([100, 1]);
    expect(payload).toContainEqual([20, 3]);
    expect(payload.length).toBe(2);
  });

  test("all denominations in payload", () => {
    const all: InsertedMoney = {
      1: 1,
      5: 2,
      10: 3,
      20: 4,
      50: 5,
      100: 6,
      500: 7,
      1000: 8,
    };
    const payload = buildInsertedMoneyPayload(all);
    expect(payload.length).toBe(8);
  });
});

describe("Purchase Validation (client-side)", () => {
  test("cannot purchase with insufficient credit", () => {
    const credit = calculateCredit({ 10: 1 }); // 10 THB
    const price = 25;
    expect(credit < price).toBe(true);
  });

  test("can purchase with exact credit", () => {
    const credit = calculateCredit({ 20: 1, 5: 1 }); // 25 THB
    const price = 25;
    expect(credit >= price).toBe(true);
  });

  test("can purchase with overpayment", () => {
    const credit = calculateCredit({ 100: 1 }); // 100 THB
    const price = 25;
    expect(credit >= price).toBe(true);
    expect(credit - price).toBe(75); // change expected
  });

  test("cannot select out-of-stock product", () => {
    const stock = getStockStatus(0);
    expect(stock.cls).toBe("no-stock");
    // UI should prevent selection
  });
});
