-- Gapuz POS System - Full Database SQL
-- Gapuz Computer Services and Accessories
-- Stack: Supabase PostgreSQL
-- Run this in Supabase Dashboard -> SQL Editor -> New query -> Run.
--
-- NOTE: there is no "users" table here on purpose. Logins go through
-- Supabase's built-in Auth (auth.users), which handles password hashing
-- and sessions for you. The "profiles" table below just attaches a
-- name + role (admin/cashier) to each auth user.

-- 1. PROFILES (role + display name, one row per auth user)
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       VARCHAR(100) NOT NULL,
  role       VARCHAR(20)  NOT NULL DEFAULT 'cashier' CHECK (role IN ('admin','cashier')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. PRODUCTS
CREATE TABLE products (
  product_id   SERIAL PRIMARY KEY,
  name         VARCHAR(150) NOT NULL,
  category     VARCHAR(50)  NOT NULL,
  price        NUMERIC(10,2) NOT NULL,
  cost_price   NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock        INTEGER NOT NULL DEFAULT 0,
  barcode      VARCHAR(50),
  icon         VARCHAR(10),
  image        TEXT,
  sold         INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sold_at TIMESTAMP WITH TIME ZONE
);

INSERT INTO products (name, category, price, cost_price, stock, barcode, icon, sold) VALUES
('AMD Ryzen 5 5600X',         'Processors',  9500,  7200,  12, 'CPU-001', '💻', 24),
('Intel Core i5-12400',       'Processors',  10500, 8000,  8,  'CPU-002', '💻', 18),
('AMD Ryzen 7 5800X',         'Processors',  15000, 11500, 5,  'CPU-003', '💻', 12),
('Kingston 8GB DDR4 3200MHz', 'RAM',         1800,  1300,  20, 'RAM-001', '🧩', 35),
('Corsair 16GB DDR4 3200MHz', 'RAM',         3200,  2400,  15, 'RAM-002', '🧩', 28),
('NVIDIA RTX 3060 12GB',      'GPU',         22000, 17000, 4,  'GPU-001', '🎮', 8),
('AMD RX 6600 8GB',           'GPU',         16500, 12500, 6,  'GPU-002', '🎮', 11),
('Samsung 500GB SSD',         'Storage',     2800,  2100,  18, 'SSD-001', '💾', 42),
('WD 1TB HDD',                'Storage',     1900,  1400,  22, 'HDD-001', '💾', 31),
('Laptop Acer Aspire 5',      'Laptops',     35000, 28000, 3,  'LAP-001', '💻', 5),
('Laptop ASUS VivoBook',      'Laptops',     28000, 22000, 4,  'LAP-002', '💻', 7),
('Gaming Mouse Logitech',     'Peripherals', 1200,  850,   25, 'PER-001', '🖱️', 38),
('Mechanical Keyboard',       'Peripherals', 2500,  1800,  15, 'PER-002', '⌨️', 22),
('USB-C Hub 7-in-1',          'Accessories', 1500,  1100,  30, 'ACC-001', '🔌', 55),
('HDMI Cable 2m',             'Accessories', 350,   200,   50, 'ACC-002', '🔌', 88),
('PC Cleaning Service',       'Services',    500,   0,     0,  'SVC-001', '🔧', 15),
('OS Installation',           'Services',    800,   0,     0,  'SVC-002', '💿', 20);

-- 3. CUSTOMERS
CREATE TABLE customers (
  customer_id  SERIAL PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  email        VARCHAR(100),
  phone        VARCHAR(20),
  address      TEXT,
  points       INTEGER NOT NULL DEFAULT 0,
  purchases    INTEGER NOT NULL DEFAULT 0,
  total_spent  NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO customers (name, email, phone, address, points, purchases, total_spent) VALUES
('Juan dela Cruz',  'juan@email.com',  '0917-111-1111', 'CDO City', 1520, 12, 45000),
('Maria Santos',    'maria@email.com', '0918-222-2222', 'CDO City', 320,  4,  12000),
('Pedro Reyes',     'pedro@email.com', '0919-333-3333', 'CDO City', 3200, 28, 98000),
('Ana Garcia',      'ana@email.com',   '0920-444-4444', 'CDO City', 450,  8,  22000),
('Carlo Bautista',  'carlo@email.com', '0921-555-5555', 'CDO City', 2480, 31, 179000),
('Liza Villanueva', 'liza@email.com',  '0922-666-6666', 'CDO City', 520,  5,  23000);

-- 4. TRANSACTIONS
-- payment is free text (e.g. "Cash", "GCash", "Card", or "Cash+GCash" for split payments)
CREATE TABLE transactions (
  transaction_id SERIAL PRIMARY KEY,
  customer_id    INTEGER REFERENCES customers(customer_id) ON DELETE SET NULL,
  customer_name  VARCHAR(100) DEFAULT 'Walk-in',
  payment        VARCHAR(30)  NOT NULL,
  subtotal       NUMERIC(10,2) NOT NULL DEFAULT 0,
  disc_amt       NUMERIC(10,2) NOT NULL DEFAULT 0,
  vat            NUMERIC(10,2) NOT NULL DEFAULT 0,
  total          NUMERIC(10,2) NOT NULL DEFAULT 0,
  cash_given     NUMERIC(10,2),
  status         VARCHAR(20)  NOT NULL DEFAULT 'Completed',
  cashier_name   VARCHAR(100),
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TRANSACTION_ITEMS (line items per sale)
CREATE TABLE transaction_items (
  item_id        SERIAL PRIMARY KEY,
  transaction_id INTEGER NOT NULL REFERENCES transactions(transaction_id) ON DELETE CASCADE,
  product_id     INTEGER REFERENCES products(product_id) ON DELETE SET NULL,
  name           VARCHAR(150) NOT NULL,
  qty            INTEGER NOT NULL DEFAULT 1,
  price          NUMERIC(10,2) NOT NULL,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. REFUNDS
CREATE TABLE refunds (
  refund_id      SERIAL PRIMARY KEY,
  transaction_id INTEGER REFERENCES transactions(transaction_id) ON DELETE SET NULL,
  customer_name  VARCHAR(100) DEFAULT 'Walk-in',
  reason         VARCHAR(150),
  refund_method  VARCHAR(30),
  total          NUMERIC(10,2) NOT NULL DEFAULT 0,
  status         VARCHAR(20)  NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected')),
  processed_by   VARCHAR(100),
  items          JSONB,
  subtotal       NUMERIC(10,2) DEFAULT 0,
  vat            NUMERIC(10,2) DEFAULT 0,
  notes          TEXT,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. HOLDS (parked carts)
CREATE TABLE holds (
  hold_id      SERIAL PRIMARY KEY,
  label        VARCHAR(100) NOT NULL,
  items        JSONB NOT NULL,
  customer_id  INTEGER REFERENCES customers(customer_id) ON DELETE SET NULL,
  saved_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ROW LEVEL SECURITY
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds           ENABLE ROW LEVEL SECURITY;
ALTER TABLE holds             ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON transaction_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON refunds FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON holds FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated insert" ON transaction_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated insert" ON refunds FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated insert" ON customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated insert" ON products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated insert" ON holds FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated update" ON customers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated update" ON refunds FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated update" ON transactions FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON products FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete" ON holds FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete" ON customers FOR DELETE TO authenticated USING (true);

-- INDEXES
CREATE INDEX idx_transactions_customer   ON transactions(customer_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transaction_items_txn   ON transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_prod  ON transaction_items(product_id);
CREATE INDEX idx_refunds_transaction     ON refunds(transaction_id);
CREATE INDEX idx_refunds_status          ON refunds(status);
CREATE INDEX idx_products_category       ON products(category);

-- VIEWS
CREATE VIEW sales_summary AS
SELECT DATE(t.created_at)      AS sale_date,
       COUNT(t.transaction_id) AS total_transactions,
       SUM(t.subtotal)         AS total_subtotal,
       SUM(t.disc_amt)         AS total_discount,
       SUM(t.vat)              AS total_vat,
       SUM(t.total)            AS total_revenue,
       t.payment               AS payment_method
FROM transactions t
GROUP BY DATE(t.created_at), t.payment
ORDER BY sale_date DESC;

CREATE VIEW product_sales AS
SELECT p.product_id, p.name, p.category, p.price, p.cost_price, p.stock, p.sold,
       ROUND(((p.price - p.cost_price) / NULLIF(p.price, 0)) * 100, 2) AS margin_percent,
       CASE
         WHEN p.price < p.cost_price THEN 'At Loss'
         WHEN ((p.price - p.cost_price) / NULLIF(p.price, 0)) * 100 <= 15 THEN 'Low Margin'
         ELSE 'Healthy'
       END AS margin_status
FROM products p
ORDER BY p.sold DESC;

CREATE VIEW customer_loyalty AS
SELECT c.customer_id, c.name, c.points, c.purchases, c.total_spent,
       CASE
         WHEN c.points >= 3000 THEN 'Platinum'
         WHEN c.points >= 1500 THEN 'Gold'
         WHEN c.points >= 500  THEN 'Silver'
         ELSE 'Bronze'
       END AS loyalty_tier
FROM customers c
ORDER BY c.points DESC;
