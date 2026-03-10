"use client";

import { useState, useEffect, useCallback } from "react";
import { Product, InsertedMoney, PurchaseResponse } from "@/types";
import * as api from "@/lib/api";

const DENOMINATIONS = [
  { value: 1, type: "coin" },
  { value: 5, type: "coin" },
  { value: 10, type: "coin" },
  { value: 20, type: "note" },
  { value: 50, type: "note" },
  { value: 100, type: "note" },
  { value: 500, type: "note" },
  { value: 1000, type: "note" },
];

const PRODUCT_EMOJIS: Record<string, string> = {
  Water: "💧",
  Cola: "🥤",
  "Green Tea": "🍵",
  "Orange Juice": "🍊",
  Coffee: "☕",
  "Energy Drink": "⚡",
  Chips: "🍟",
  "Chocolate Bar": "🍫",
  Cookies: "🍪",
};

function getStockStatus(qty: number) {
  if (qty <= 0) return { label: "Out of Stock", cls: "no-stock" };
  if (qty <= 3) return { label: `${qty} left`, cls: "low-stock" };
  return { label: `${qty} in stock`, cls: "in-stock" };
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [insertedMoney, setInsertedMoney] = useState<InsertedMoney>({});
  const [result, setResult] = useState<PurchaseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const totalCredit = Object.entries(insertedMoney).reduce(
    (sum, [denom, count]) => sum + Number(denom) * count,
    0
  );

  const fetchProducts = useCallback(async () => {
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch {
      setError("Failed to load products. Is the backend running?");
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 4000);
      return () => clearTimeout(t);
    }
  }, [error]);

  const insertDenomination = (denom: number) => {
    setInsertedMoney((prev) => ({
      ...prev,
      [denom]: (prev[denom] || 0) + 1,
    }));
  };

  const resetCredit = () => {
    setInsertedMoney({});
    setSelectedProduct(null);
  };

  const handlePurchase = async () => {
    if (!selectedProduct) {
      setError("Please select a product first");
      return;
    }
    if (totalCredit < selectedProduct.price) {
      setError(
        `Insert at least ฿${selectedProduct.price - totalCredit} more`
      );
      return;
    }

    setLoading(true);
    try {
      const inserted: [number, number][] = Object.entries(insertedMoney)
        .filter(([, c]) => c > 0)
        .map(([d, c]) => [Number(d), c]);

      const res = await api.purchase({
        product_id: selectedProduct.id,
        inserted_money: inserted,
      });
      setResult(res);
      setInsertedMoney({});
      setSelectedProduct(null);
      fetchProducts();
    } catch (err: any) {
      setError(err.message || "Purchase failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="container header-inner">
          <div className="logo">⚡ VendX</div>
          <nav className="nav-links">
            <a href="/" className="nav-link active">
              Machine
            </a>
            <a href="/admin" className="nav-link">
              Admin
            </a>
          </nav>
        </div>
      </header>

      <main className="container main-layout">
        {/* Product Grid */}
        <section>
          <div className="section-title">
            <span className="icon">🏪</span> Select a Product
          </div>
          <div className="product-grid">
            {products.map((p) => {
              const stock = getStockStatus(p.stock_quantity);
              const emoji = PRODUCT_EMOJIS[p.name] || "📦";
              return (
                <div
                  key={p.id}
                  id={`product-${p.id}`}
                  className={`glass-card product-card ${
                    selectedProduct?.id === p.id ? "selected" : ""
                  } ${p.stock_quantity <= 0 ? "out-of-stock" : ""}`}
                  onClick={() =>
                    p.stock_quantity > 0 && setSelectedProduct(p)
                  }
                  style={{
                    opacity: p.stock_quantity <= 0 ? 0.5 : 1,
                    cursor: p.stock_quantity <= 0 ? "not-allowed" : "pointer",
                  }}
                >
                  <div className="product-icon">{emoji}</div>
                  <div className="product-name">{p.name}</div>
                  <div className="product-price">฿{p.price}</div>
                  <span className={`stock-badge ${stock.cls}`}>
                    {stock.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Sidebar: Cash Panel */}
        <aside className="sidebar">
          {/* Credit Display */}
          <div className="glass-card credit-display">
            <div className="credit-label">Your Credit</div>
            <div className="credit-amount">฿{totalCredit}</div>
            {selectedProduct && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  color: "var(--text-secondary)",
                }}
              >
                Selected: <strong>{selectedProduct.name}</strong> — ฿
                {selectedProduct.price}
              </div>
            )}
          </div>

          {/* Coin Buttons */}
          <div className="glass-card cash-panel">
            <h3>🪙 Coins</h3>
            <div className="denom-group">
              {DENOMINATIONS.filter((d) => d.type === "coin").map((d) => (
                <button
                  key={d.value}
                  id={`insert-${d.value}`}
                  className="denom-btn coin"
                  onClick={() => insertDenomination(d.value)}
                >
                  {d.value}
                  <span className="denom-label">THB</span>
                </button>
              ))}
            </div>

            <h3>💵 Notes</h3>
            <div className="denom-group">
              {DENOMINATIONS.filter((d) => d.type === "note").map((d) => (
                <button
                  key={d.value}
                  id={`insert-${d.value}`}
                  className="denom-btn note"
                  onClick={() => insertDenomination(d.value)}
                >
                  {d.value}
                  <span className="denom-label">THB</span>
                </button>
              ))}
            </div>

            {/* Inserted summary */}
            {totalCredit > 0 && (
              <div className="inserted-summary">
                {Object.entries(insertedMoney)
                  .filter(([, c]) => c > 0)
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .map(([d, c]) => (
                    <span key={d} className="inserted-chip">
                      ฿{d} × {c}
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button
              className="btn btn-ghost"
              onClick={resetCredit}
              disabled={totalCredit === 0 && !selectedProduct}
            >
              Cancel
            </button>
            <button
              id="purchase-btn"
              className="btn btn-success btn-lg"
              onClick={handlePurchase}
              disabled={
                !selectedProduct ||
                totalCredit < (selectedProduct?.price || 0) ||
                loading
              }
            >
              {loading ? "Processing..." : "Purchase"}
            </button>
          </div>
        </aside>
      </main>

      {/* Success Modal */}
      {result && (
        <div className="modal-overlay" onClick={() => setResult(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>✅ Purchase Successful!</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>
              You purchased <strong>{result.product_name}</strong> for ฿
              {result.price}
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  padding: 12,
                  background: "var(--bg-glass)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    marginBottom: 4,
                  }}
                >
                  PAID
                </div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  ฿{result.amount_paid}
                </div>
              </div>
              <div
                style={{
                  padding: 12,
                  background: "var(--bg-glass)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    marginBottom: 4,
                  }}
                >
                  CHANGE
                </div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  ฿{result.change_amount}
                </div>
              </div>
            </div>

            {result.change_breakdown.length > 0 && (
              <>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginBottom: 8,
                  }}
                >
                  CHANGE BREAKDOWN
                </div>
                <ul className="change-list">
                  {result.change_breakdown.map((c) => (
                    <li key={c.denomination} className="change-item">
                      ฿{c.denomination} × {c.count}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <button
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 12 }}
              onClick={() => setResult(null)}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && <div className="error-toast">⚠️ {error}</div>}
    </>
  );
}
