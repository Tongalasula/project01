const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

const DB_PATH = path.join(__dirname, 'azani_isp.db');

async function getDb() {
    return open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });
}

const CONSTANTS = {
    FEES: {
        REGISTRATION: 8500,
        INSTALLATION: 10000,
        PC_UNIT: 40000,
        RECONNECTION: 1000
    },
    RATES: {
        UPGRADE_DISCOUNT: 0.10,
        LATE_FEE_SURCHARGE: 0.15
    }
};

async function initDb() {
    const db = await getDb();
    await db.exec(`
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
            period TEXT, 
            amount_due REAL NOT NULL,
            amount_paid REAL DEFAULT 0,
            due_date DATE NOT NULL,
            payment_date DATE,
            surcharge REAL DEFAULT 0,
            discount REAL DEFAULT 0
        );
    `);

    // Seed data
    await db.run('INSERT OR IGNORE INTO Pricing_Bandwidth (mbps, price) VALUES (4, 1200), (10, 2000), (20, 3500), (25, 4000), (50, 7000)');
    await db.run("INSERT OR IGNORE INTO Pricing_LAN (node_range, min_nodes, max_nodes, price) VALUES ('2-10', 2, 10, 10000), ('11-20', 11, 20, 20000), ('21-40', 21, 40, 30000), ('41-100', 41, 100, 40000)");

    return db;
}

/**
 * Calculates total installation costs including PCs and LAN nodes.
 */
async function calculateInstallationCost(subId) {
    const db = await getDb();
    const sub = await db.get(`
        SELECT s.*, pl.price as lan_price 
        FROM Subscriptions s
        LEFT JOIN Pricing_LAN pl ON s.lan_nodes BETWEEN pl.min_nodes AND pl.max_nodes
        WHERE s.id = ?`, subId);

    if (!sub) throw new Error('Subscription not found');

    const total = CONSTANTS.FEES.REGISTRATION + 
                  CONSTANTS.FEES.INSTALLATION + 
                  (sub.pc_count * CONSTANTS.FEES.PC_UNIT) + 
                  (sub.lan_price || 0);
    
    return total;
}

/**
 * Calculates monthly charge for a subscription, applying upgrade discount if applicable.
 */
async function calculateMonthlyCharge(subId) {
    const db = await getDb();
    const sub = await db.get(`
        SELECT s.*, pb.price as base_price 
        FROM Subscriptions s
        JOIN Pricing_Bandwidth pb ON s.bandwidth_id = pb.id
        WHERE s.id = ?`, subId);

    if (!sub) throw new Error('Subscription not found');

    let charge = sub.base_price;
    let discount = 0;

    if (sub.is_upgrade) {
        discount = charge * CONSTANTS.RATES.UPGRADE_DISCOUNT;
        charge -= discount;
    }

    return { total: charge, discount };
}

/**
 * Logic for late fees (15% surcharge)
 */
function calculateSurcharge(amountDue, dueDate, paymentDate) {
    const due = new Date(dueDate);
    const paid = new Date(paymentDate);
    
    // Last day of the month check
    const lastDayOfMonth = new Date(due.getFullYear(), due.getMonth() + 1, 0);
    
    if (paid > lastDayOfMonth) {
        return amountDue * CONSTANTS.RATES.LATE_FEE_SURCHARGE;
    }
    return 0;
}

module.exports = {
    initDb,
    getDb,
    calculateInstallationCost,
    calculateMonthlyCharge,
    calculateSurcharge,
    CONSTANTS
};
