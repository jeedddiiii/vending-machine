import {
  Product,
  CurrencyStock,
  Transaction,
  PurchaseRequest,
  PurchaseResponse,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ---- Products ----
export const getProducts = () =>
  fetchJson<Product[]>(`${API_BASE}/api/products`);

export const getProduct = (id: number) =>
  fetchJson<Product>(`${API_BASE}/api/products/${id}`);

export const createProduct = (data: Omit<Product, "id">) =>
  fetchJson<Product>(`${API_BASE}/api/products`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateProduct = (id: number, data: Partial<Product>) =>
  fetchJson<Product>(`${API_BASE}/api/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteProduct = (id: number) =>
  fetchJson<{ deleted: boolean }>(`${API_BASE}/api/products/${id}`, {
    method: "DELETE",
  });

// ---- Currency ----
export const getCurrency = () =>
  fetchJson<CurrencyStock[]>(`${API_BASE}/api/currency`);

export const updateCurrency = (denomination: number, count: number) =>
  fetchJson<CurrencyStock>(`${API_BASE}/api/currency/${denomination}`, {
    method: "PUT",
    body: JSON.stringify({ count }),
  });

// ---- Purchase ----
export const purchase = (data: PurchaseRequest) =>
  fetchJson<PurchaseResponse>(`${API_BASE}/api/purchase`, {
    method: "POST",
    body: JSON.stringify(data),
  });

// ---- Transactions ----
export const getTransactions = () =>
  fetchJson<Transaction[]>(`${API_BASE}/api/transactions`);
