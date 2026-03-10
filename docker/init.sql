-- Products
CREATE TABLE IF NOT EXISTS products (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    price           INTEGER NOT NULL,
    stock_quantity  INTEGER NOT NULL DEFAULT 0,
    image_url       TEXT
);

-- Currency Stock
CREATE TABLE IF NOT EXISTS currency_stock (
    denomination    INTEGER PRIMARY KEY,
    currency_type   VARCHAR(10) NOT NULL CHECK (currency_type IN ('coin', 'note')),
    count           INTEGER NOT NULL DEFAULT 0
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id              SERIAL PRIMARY KEY,
    product_id      INTEGER NOT NULL REFERENCES products(id),
    amount_paid     INTEGER NOT NULL,
    change_given    INTEGER NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed currency denominations
INSERT INTO currency_stock (denomination, currency_type, count) VALUES
    (1,    'coin', 100),
    (5,    'coin', 100),
    (10,   'coin', 100),
    (20,   'note', 50),
    (50,   'note', 50),
    (100,  'note', 50),
    (500,  'note', 20),
    (1000, 'note', 20)
ON CONFLICT (denomination) DO NOTHING;

-- Seed sample products
INSERT INTO products (name, price, stock_quantity, image_url) VALUES
    ('Water',           10, 20, NULL),
    ('Cola',            15, 15, NULL),
    ('Green Tea',       20, 15, NULL),
    ('Orange Juice',    25, 10, NULL),
    ('Coffee',          30, 12, NULL),
    ('Energy Drink',    35, 10, NULL),
    ('Chips',           20, 18, NULL),
    ('Chocolate Bar',   25, 14, NULL),
    ('Cookies',         30, 12, NULL)
ON CONFLICT DO NOTHING;
