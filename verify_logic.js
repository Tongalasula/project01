const db = require('./database');

async function test() {
    console.log('--- Starting Azani ISP Logic Verification ---');
    await db.initDb();

    // 1. Create a dummy institution
    const database = await db.getDb();
    const inst = await database.run('INSERT INTO Institutions (name, category, contact_person, contact_phone) VALUES (?, ?, ?, ?)',
        ['Test Senior School', 'Senior', 'John Doe', '0712345678']);
    const instId = inst.lastID;

    // 2. Setup Subscription (Upgrade with 10 PCs and 15 LAN nodes)
    // Bandwidth 50MBPS is ID 5
    const sub = await database.run('INSERT INTO Subscriptions (institution_id, bandwidth_id, lan_nodes, pc_count, is_upgrade) VALUES (?, ?, ?, ?, ?)',
        [instId, 5, 15, 10, 1]); // is_upgrade = 1
    const subId = sub.lastID;

    // 3. Verify Installation Cost
    // Registration (8500) + Installation (10000) + 10 PCs (400,000) + 11-20 LAN nodes (20,000) = 438,500
    const instCost = await db.calculateInstallationCost(subId);
    console.log(`Installation Cost (Expected 438,500): ${instCost}`);
    if (instCost === 438500) console.log('\u2705 Installation Cost Correct');
    else console.log('\u274c Installation Cost Incorrect');

    // 4. Verify Upgrade Discount (50MBPS price is 7000)
    // 7000 - 10% = 6300
    const monthly = await db.calculateMonthlyCharge(subId);
    console.log(`Monthly Charge (Expected 6,300, Discount 700): Total=${monthly.total}, Discount=${monthly.discount}`);
    if (monthly.total === 6300 && monthly.discount === 700) console.log('\u2705 Upgrade Discount Correct');
    else console.log('\u274c Upgrade Discount Incorrect');

    // 5. Verify Late Fee Surcharge
    // Monthly 6300, Due 2026-01-01, Paid 2026-02-15 (Late)
    // 6300 * 0.15 = 945
    const surcharge = db.calculateSurcharge(6300, '2026-01-01', '2026-02-15');
    console.log(`Surcharge (Expected 945): ${surcharge}`);
    if (surcharge === 945) console.log('\u2705 Late Fee Surcharge Correct');
    else console.log('\u274c Late Fee Surcharge Incorrect');

    console.log('--- Verification Complete ---');
    process.exit(0);
}

test().catch(err => {
    console.error(err);
    process.exit(1);
});
