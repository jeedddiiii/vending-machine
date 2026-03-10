# VendX — Vending Machine Web App

A full-stack vending machine simulator with a **Next.js (TypeScript)** frontend and **Rust (Axum)** backend, backed by **PostgreSQL**.

## 🏗 Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Backend    │────▶│  PostgreSQL  │
│  Next.js 14  │     │  Rust/Axum   │     │    (v16)     │
│  Port 3000   │     │  Port 8080   │     │  Port 5432   │
└──────────────┘     └──────────────┘     └──────────────┘
```

### Backend (DDD Layers)
```
backend/src/
├── domain/       # Entities, value objects, change algorithm
├── repository/   # Database access (SQLx)
├── service/      # Business logic orchestration
├── api/          # HTTP handlers (Axum)
├── error.rs      # Unified error types
└── config.rs     # Environment config
```

## 🚀 Quick Start

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)

### Run Everything

```bash
docker compose up --build
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080/api
- **Database**: localhost:5432 (user: `vending`, pass: `vending_secret`)

### Stop
```bash
docker compose down        # keep data
docker compose down -v     # remove data volumes
```

### Run Tests

**Backend (Rust)** — 26 unit tests covering change algorithm + purchase validation:
```bash
docker compose run --rm backend cargo test
# or locally if Rust is installed:
cd backend && cargo test
```

**Frontend (TypeScript)** — 39 unit tests covering business logic + API client:
```bash
docker compose run --rm frontend npm test
# or locally if Node.js is installed:
cd frontend && npm install && npm test
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products |
| GET | `/api/products/:id` | Get product by ID |
| POST | `/api/products` | Create product (admin) |
| PUT | `/api/products/:id` | Update product (admin) |
| DELETE | `/api/products/:id` | Delete product (admin) |
| GET | `/api/currency` | List currency stock |
| PUT | `/api/currency/:denomination` | Update denomination count |
| POST | `/api/purchase` | Purchase a product |
| GET | `/api/transactions` | List recent transactions |

### Purchase Request Example
```json
{
  "product_id": 1,
  "inserted_money": [[100, 1], [50, 1]]
}
```
This means: 1 × ฿100 note + 1 × ฿50 note inserted.

### Purchase Response Example
```json
{
  "product_name": "Cola",
  "price": 15,
  "amount_paid": 150,
  "change_amount": 135,
  "change_breakdown": [
    { "denomination": 100, "count": 1 },
    { "denomination": 20, "count": 1 },
    { "denomination": 10, "count": 1 },
    { "denomination": 5, "count": 1 }
  ],
  "transaction_id": 1
}
```

## 🧮 Change-Making Algorithm

Uses a **greedy algorithm** (largest-denomination-first). For the Thai denominations (1, 5, 10, 20, 50, 100, 500, 1000 THB), the greedy approach is guaranteed to produce correct results. The algorithm:

1. Sorts available denominations descending.
2. For each denomination, uses as many as possible without exceeding the remaining change.
3. Accounts for actual stock — won't use denominations it doesn't have.
4. Returns `None` if exact change is impossible.

## 🎨 Design Decisions

- **Axum over Actix-web**: Lighter, fully tokio-native, modern Rust async patterns.
- **SQLx over SeaORM/Diesel**: Direct SQL with compile-time safety option, minimal abstraction overhead.
- **DDD layers**: Clean separation of domain logic from infrastructure concerns.
- **Atomic transactions**: Purchases use a single PostgreSQL transaction to ensure consistency (stock decrement + currency update + transaction record).
- **Greedy change**: Sufficient for standard currency denominations. A DP approach would handle non-standard denominations but isn't needed here.

## 🗃 Database Schema

| Table | Purpose |
|-------|---------|
| `products` | Product catalog with name, price, stock |
| `currency_stock` | Available denominations and counts |
| `transactions` | Purchase history with paid/change amounts |

Seeded with 9 sample products and standard Thai denominations on first startup.

## 📱 Frontend Features

- **Customer View** (`/`): Product grid, coin/note insertion buttons, credit display, purchase flow with change breakdown.
- **Admin View** (`/admin`): Product CRUD, currency stock management, transaction history.
- **Responsive**: Works on mobile and desktop.
- **Premium dark theme**: Glassmorphism cards, gradient accents, micro-animations.

## ⚠️ Assumptions

1. All prices and denominations are integer THB (no satang).
2. The machine starts with seeded currency stock (100 coins each, 50/20 notes).
3. No authentication — admin routes are open (not production-ready).
4. The greedy algorithm is sufficient for Thai denominations.
5. Transaction history is limited to the most recent 100 entries.
