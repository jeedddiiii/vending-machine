"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Product,
  CurrencyStock,
  Transaction,
} from "@/types";
import * as api from "@/lib/api";

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currency, setCurrency] = useState<CurrencyStock[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(
    null
  );
  const [isNew, setIsNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [p, c, t] = await Promise.all([
        api.getProducts(),
        api.getCurrency(),
        api.getTransactions(),
      ]);
      setProducts(p);
      setCurrency(c);
      setTransactions(t);
    } catch {
      setError("Failed to load data");
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (error || success) {
      const t = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [error, success]);

  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    try {
      if (isNew) {
        await api.createProduct({
          name: editingProduct.name || "",
          price: editingProduct.price || 0,
          stock_quantity: editingProduct.stock_quantity || 0,
          image_url: editingProduct.image_url || null,
        });
        setSuccess("Product created!");
      } else {
        await api.updateProduct(editingProduct.id!, {
          name: editingProduct.name,
          price: editingProduct.price,
          stock_quantity: editingProduct.stock_quantity,
        });
        setSuccess("Product updated!");
      }
      setEditingProduct(null);
      setIsNew(false);
      fetchAll();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    try {
      await api.deleteProduct(id);
      setSuccess("Product deleted");
      fetchAll();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCurrencyUpdate = async (denomination: number, count: string) => {
    const num = parseInt(count, 10);
    if (isNaN(num) || num < 0) return;
    try {
      await api.updateCurrency(denomination, num);
      setSuccess(`Updated ฿${denomination} stock`);
      fetchAll();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="container header-inner">
          <div className="logo">⚡ VendX</div>
          <nav className="nav-links">
            <a href="/" className="nav-link">
              Machine
            </a>
            <a href="/admin" className="nav-link active">
              Admin
            </a>
          </nav>
        </div>
      </header>

      <main className="container admin-layout">
        {/* ---- Products Section ---- */}
        <div className="glass-card admin-card">
          <div
            className="section-title"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>
              <span className="icon" style={{ display: "inline-flex" }}>
                📦
              </span>{" "}
              Products
            </span>
            <button
              id="add-product-btn"
              className="btn btn-primary btn-sm"
              onClick={() => {
                setIsNew(true);
                setEditingProduct({
                  name: "",
                  price: 10,
                  stock_quantity: 10,
                  image_url: "",
                });
              }}
            >
              + Add Product
            </button>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Price (฿)</th>
                <th>Stock</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td style={{ color: "var(--text-muted)" }}>{p.id}</td>
                  <td>{p.name}</td>
                  <td>
                    <span style={{ fontWeight: 600 }}>฿{p.price}</span>
                  </td>
                  <td>{p.stock_quantity}</td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ marginRight: 8 }}
                      onClick={() => {
                        setIsNew(false);
                        setEditingProduct({ ...p });
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteProduct(p.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ---- Currency Stock Section ---- */}
        <div className="glass-card admin-card">
          <div className="section-title">
            <span className="icon">💰</span> Currency Stock
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Denomination</th>
                <th>Type</th>
                <th>Count</th>
                <th style={{ textAlign: "right" }}>Update</th>
              </tr>
            </thead>
            <tbody>
              {currency.map((c) => (
                <tr key={c.denomination}>
                  <td>
                    <strong>฿{c.denomination}</strong>
                  </td>
                  <td>
                    <span
                      style={{
                        color:
                          c.currency_type === "coin"
                            ? "var(--accent-amber)"
                            : "var(--accent-emerald)",
                        fontWeight: 500,
                      }}
                    >
                      {c.currency_type === "coin" ? "🪙 Coin" : "💵 Note"}
                    </span>
                  </td>
                  <td>{c.count}</td>
                  <td style={{ textAlign: "right" }}>
                    <input
                      id={`currency-input-${c.denomination}`}
                      className="admin-input"
                      type="number"
                      min={0}
                      defaultValue={c.count}
                      style={{ width: 80, display: "inline-block" }}
                      onBlur={(e) =>
                        handleCurrencyUpdate(c.denomination, e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleCurrencyUpdate(
                            c.denomination,
                            (e.target as HTMLInputElement).value
                          );
                        }
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ---- Transactions Section ---- */}
        <div className="glass-card admin-card">
          <div className="section-title">
            <span className="icon">📜</span> Recent Transactions
          </div>
          {transactions.length === 0 ? (
            <p style={{ color: "var(--text-muted)", padding: "20px 0" }}>
              No transactions yet.
            </p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product</th>
                  <th>Paid (฿)</th>
                  <th>Change (฿)</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const prod = products.find((p) => p.id === tx.product_id);
                  return (
                    <tr key={tx.id}>
                      <td style={{ color: "var(--text-muted)" }}>#{tx.id}</td>
                      <td>{prod?.name || `Product #${tx.product_id}`}</td>
                      <td>฿{tx.amount_paid}</td>
                      <td>฿{tx.change_given}</td>
                      <td style={{ color: "var(--text-muted)", fontSize: 13 }}>
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* ---- Edit / Create Product Modal ---- */}
      {editingProduct && (
        <div className="modal-overlay" onClick={() => setEditingProduct(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{isNew ? "Add New Product" : "Edit Product"}</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <label>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Name
                </span>
                <input
                  id="product-name-input"
                  className="admin-input"
                  type="text"
                  value={editingProduct.name || ""}
                  onChange={(e) =>
                    setEditingProduct((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Price (฿)
                </span>
                <input
                  id="product-price-input"
                  className="admin-input"
                  type="number"
                  min={1}
                  value={editingProduct.price || ""}
                  onChange={(e) =>
                    setEditingProduct((prev) => ({
                      ...prev,
                      price: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                />
              </label>
              <label>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Stock Quantity
                </span>
                <input
                  id="product-stock-input"
                  className="admin-input"
                  type="number"
                  min={0}
                  value={editingProduct.stock_quantity ?? ""}
                  onChange={(e) =>
                    setEditingProduct((prev) => ({
                      ...prev,
                      stock_quantity: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                />
              </label>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button
                className="btn btn-ghost"
                style={{ flex: 1 }}
                onClick={() => {
                  setEditingProduct(null);
                  setIsNew(false);
                }}
              >
                Cancel
              </button>
              <button
                id="save-product-btn"
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handleSaveProduct}
              >
                {isNew ? "Create" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      {error && <div className="error-toast">⚠️ {error}</div>}
      {success && (
        <div
          className="error-toast"
          style={{
            borderColor: "rgba(16, 185, 129, 0.3)",
            color: "var(--accent-emerald)",
          }}
        >
          ✅ {success}
        </div>
      )}
    </>
  );
}
