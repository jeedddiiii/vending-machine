/**
 * API Client Tests
 *
 * Tests the fetch wrapper functions with mocked responses.
 */

import {
  getProducts,
  getCurrency,
  purchase,
  createProduct,
  updateProduct,
  deleteProduct,
  updateCurrency,
  getTransactions,
} from "@/lib/api";

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

function mockJsonResponse(data: any, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  });
}

describe("getProducts", () => {
  test("returns product list on success", async () => {
    const products = [
      { id: 1, name: "Cola", price: 15, stock_quantity: 10, image_url: null },
    ];
    mockJsonResponse(products);

    const result = await getProducts();
    expect(result).toEqual(products);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/products"),
      expect.objectContaining({ headers: expect.any(Object) })
    );
  });

  test("throws on server error", async () => {
    mockJsonResponse({ error: "Internal error" }, 500);
    await expect(getProducts()).rejects.toThrow("Internal error");
  });
});

describe("getCurrency", () => {
  test("returns currency stock list", async () => {
    const currency = [
      { denomination: 10, currency_type: "coin", count: 100 },
    ];
    mockJsonResponse(currency);

    const result = await getCurrency();
    expect(result).toEqual(currency);
  });
});

describe("purchase", () => {
  test("returns purchase response on success", async () => {
    const response = {
      product_name: "Cola",
      price: 15,
      amount_paid: 20,
      change_amount: 5,
      change_breakdown: [{ denomination: 5, count: 1 }],
      transaction_id: 1,
    };
    mockJsonResponse(response);

    const result = await purchase({
      product_id: 1,
      inserted_money: [[20, 1]],
    });
    expect(result.product_name).toBe("Cola");
    expect(result.change_amount).toBe(5);
  });

  test("throws on insufficient credit", async () => {
    mockJsonResponse({ error: "Insufficient credit" }, 400);
    await expect(
      purchase({ product_id: 1, inserted_money: [[1, 1]] })
    ).rejects.toThrow("Insufficient credit");
  });

  test("throws on out of stock", async () => {
    mockJsonResponse({ error: "Product out of stock" }, 400);
    await expect(
      purchase({ product_id: 1, inserted_money: [[100, 1]] })
    ).rejects.toThrow("Product out of stock");
  });

  test("throws on cannot make change", async () => {
    mockJsonResponse(
      { error: "Machine cannot provide exact change" },
      400
    );
    await expect(
      purchase({ product_id: 1, inserted_money: [[1000, 1]] })
    ).rejects.toThrow("Machine cannot provide exact change");
  });
});

describe("Admin API", () => {
  test("createProduct sends POST with body", async () => {
    const product = {
      id: 10,
      name: "New Product",
      price: 30,
      stock_quantity: 5,
      image_url: null,
    };
    mockJsonResponse(product);

    const result = await createProduct({
      name: "New Product",
      price: 30,
      stock_quantity: 5,
      image_url: null,
    });
    expect(result.name).toBe("New Product");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/products"),
      expect.objectContaining({ method: "POST" })
    );
  });

  test("updateProduct sends PUT", async () => {
    mockJsonResponse({ id: 1, name: "Updated", price: 50, stock_quantity: 10, image_url: null });
    const result = await updateProduct(1, { name: "Updated", price: 50 });
    expect(result.name).toBe("Updated");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/products/1"),
      expect.objectContaining({ method: "PUT" })
    );
  });

  test("deleteProduct sends DELETE", async () => {
    mockJsonResponse({ deleted: true });
    const result = await deleteProduct(1);
    expect(result.deleted).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/products/1"),
      expect.objectContaining({ method: "DELETE" })
    );
  });

  test("updateCurrency sends PUT with count", async () => {
    mockJsonResponse({ denomination: 10, currency_type: "coin", count: 50 });
    const result = await updateCurrency(10, 50);
    expect(result.count).toBe(50);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/currency/10"),
      expect.objectContaining({ method: "PUT" })
    );
  });

  test("getTransactions returns list", async () => {
    const txs = [
      {
        id: 1,
        product_id: 1,
        amount_paid: 100,
        change_given: 75,
        created_at: "2026-03-09T10:00:00Z",
      },
    ];
    mockJsonResponse(txs);
    const result = await getTransactions();
    expect(result.length).toBe(1);
    expect(result[0].change_given).toBe(75);
  });
});
