const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

const DB_PATH = path.join(__dirname, 'azani_isp.db');

async function checkSchema() {
    const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });

    console.log('--- Payments Table Schema ---');
    const tableInfo = await db.all('PRAGMA table_info(Payments)');
    console.table(tableInfo);

    console.log('\n--- Sample Row ---');
    const row = await db.get('SELECT * FROM Payments LIMIT 1');
    console.log(row);

    process.exit(0);
}

checkSchema().catch(err => {
    console.error(err);
    process.exit(1);
});
