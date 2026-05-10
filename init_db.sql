-- Azani ISP Database Initialization

-- 1. Create Tables
CREATE TABLE IF NOT EXISTS Institutions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT CHECK(category IN ('Primary', 'Junior', 'Senior', 'College')),
    contact_person TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    registration_date DATE DEFAULT (DATE('now'))
);

CREATE TABLE IF NOT EXISTS Pricing_Bandwidth (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mbps INTEGER UNIQUE NOT NULL,
    price REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS Pricing_LAN (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_range TEXT NOT NULL,
    min_nodes INTEGER NOT NULL,
    max_nodes INTEGER NOT NULL,
    price REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS Subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    institution_id INTEGER REFERENCES Institutions(id),
    bandwidth_id INTEGER REFERENCES Pricing_Bandwidth(id),
    lan_nodes INTEGER NOT NULL,
    pc_count INTEGER DEFAULT 0,
    installation_date DATE DEFAULT (DATE('now')),
    is_upgrade BOOLEAN DEFAULT 0,
    status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Disconnected'))
);

CREATE TABLE IF NOT EXISTS Payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subscription_id INTEGER REFERENCES Subscriptions(id),
    type TEXT CHECK(type IN ('Registration', 'Installation', 'Monthly', 'Re-connection')),
    period TEXT, -- YYYY-MM
    amount_due REAL NOT NULL,
    amount_paid REAL DEFAULT 0,
    due_date DATE NOT NULL,
    payment_date DATE,
    surcharge REAL DEFAULT 0,
    discount REAL DEFAULT 0
);

-- 2. Seed Pricing Data
INSERT OR IGNORE INTO Pricing_Bandwidth (mbps, price) VALUES 
(4, 1200), (10, 2000), (20, 3500), (25, 4000), (50, 7000);

INSERT OR IGNORE INTO Pricing_LAN (node_range, min_nodes, max_nodes, price) VALUES 
('2-10', 2, 10, 10000), ('11-20', 11, 20, 20000), ('21-40', 21, 40, 30000), ('41-100', 41, 100, 40000);
