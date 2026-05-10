const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Initialize Database
db.initDb().then(() => {
    console.log('Database initialized successfully.');
}).catch(err => {
    console.error('Failed to initialize database:', err);
});

// --- API Endpoints ---

// 1. Institution Registration
app.post('/api/institutions', async (req, res) => {
    try {
        const { name, category, contact_person, contact_phone } = req.body;
        const database = await db.getDb();
        const result = await database.run(
            'INSERT INTO Institutions (name, category, contact_person, contact_phone) VALUES (?, ?, ?, ?)',
            [name, category, contact_person, contact_phone]
        );
        res.status(201).json({ id: result.lastID });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/institutions', async (req, res) => {
    try {
        const database = await db.getDb();
        const rows = await database.all('SELECT * FROM Institutions');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Subscriptions
app.post('/api/subscriptions', async (req, res) => {
    try {
        const { institution_id, bandwidth, lan_nodes, pc_count, is_upgrade } = req.body;
        const database = await db.getDb();

        // Get bandwidth ID
        const bw = await database.get('SELECT id FROM Pricing_Bandwidth WHERE mbps = ?', bandwidth);
        if (!bw) return res.status(400).json({ error: 'Invalid bandwidth' });

        const result = await database.run(
            'INSERT INTO Subscriptions (institution_id, bandwidth_id, lan_nodes, pc_count, is_upgrade) VALUES (?, ?, ?, ?, ?)',
            [institution_id, bw.id, lan_nodes, pc_count, is_upgrade]
        );

        // Calculate initial installation and registration payments
        const subId = result.lastID;
        const instCost = await db.calculateInstallationCost(subId);

        // Create initial payments
        await database.run(
            'INSERT INTO Payments (subscription_id, type, amount_due, due_date) VALUES (?, ?, ?, DATE("now"))',
            [subId, 'Registration', db.CONSTANTS.FEES.REGISTRATION]
        );
        await database.run(
            'INSERT INTO Payments (subscription_id, type, amount_due, due_date) VALUES (?, ?, ?, DATE("now"))',
            [subId, 'Installation', instCost - db.CONSTANTS.FEES.REGISTRATION]
        );

        res.status(201).json({ id: subId, installation_cost: instCost });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/subscriptions', async (req, res) => {
    try {
        const database = await db.getDb();
        const rows = await database.all(`
            SELECT s.id, i.name as institution_name, s.status
            FROM Subscriptions s
            JOIN Institutions i ON s.institution_id = i.id
            ORDER BY i.name
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Payments
app.post('/api/payments', async (req, res) => {
    try {
        const { subscription_id, type, amount_paid, period, payment_date } = req.body;
        const database = await db.getDb();

        let dueDate = payment_date || new Date().toISOString().split('T')[0];
        let amountDue = 0;
        let discount = 0;
        let surcharge = 0;

        console.log(`Processing payment: subId=${subscription_id}, type=${type}, period=${period}, amount_paid=${amount_paid}`);

        if (type === 'Monthly') {
            const monthly = await db.calculateMonthlyCharge(subscription_id);
            amountDue = monthly.total;
            discount = monthly.discount;

            // Check for late fee (Due date is usually 1st of month, surcharge after last day of month)
            dueDate = `${period}-01`;
            surcharge = db.calculateSurcharge(amountDue, dueDate, payment_date);
            amountDue += surcharge;
        } else if (type === 'Registration') {
            amountDue = db.CONSTANTS.FEES.REGISTRATION;
        } else if (type === 'Installation') {
            const instCost = await db.calculateInstallationCost(subscription_id);
            amountDue = instCost - db.CONSTANTS.FEES.REGISTRATION;
        }

        const result = await database.run(
            'INSERT INTO Payments (subscription_id, type, amount_due, amount_paid, period, payment_date, due_date, discount, surcharge) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [subscription_id, type, amountDue, amount_paid || 0, period, payment_date || dueDate, dueDate, discount, surcharge]
        );

        res.json({ id: result.lastID, surcharge });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. Reports
app.get('/api/reports/institutions', async (req, res) => {
    const database = await db.getDb();
    const rows = await database.all('SELECT * FROM Institutions ORDER BY name');
    res.json(rows);
});

app.get('/api/reports/defaulters', async (req, res) => {
    // Defaulters: Not paid by 10th of following month
    const database = await db.getDb();
    const rows = await database.all(`
        SELECT i.name, p.type, p.amount_due, p.amount_paid, p.due_date 
        FROM Payments p
        JOIN Subscriptions s ON p.subscription_id = s.id
        JOIN Institutions i ON s.institution_id = i.id
        WHERE p.amount_paid < p.amount_due 
        AND DATE('now') > DATE(p.due_date, '+10 days')
    `);
    res.json(rows);
});

app.get('/api/reports/infrastructure', async (req, res) => {
    const database = await db.getDb();
    const rows = await database.all(`
        SELECT i.name, s.pc_count, s.lan_nodes, pb.mbps 
        FROM Subscriptions s
        JOIN Institutions i ON s.institution_id = i.id
        JOIN Pricing_Bandwidth pb ON s.bandwidth_id = pb.id
    `);
    res.json(rows);
});

app.get('/api/reports/aggregate', async (req, res) => {
    const database = await db.getDb();
    const rows = await database.all(`
        SELECT i.name, p.type, SUM(p.amount_paid) as total_paid
        FROM Payments p
        JOIN Subscriptions s ON p.subscription_id = s.id
        JOIN Institutions i ON s.institution_id = i.id
        GROUP BY i.name, p.type
        ORDER BY i.name
    `);
    res.json(rows);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
