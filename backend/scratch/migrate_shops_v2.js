const { Sequelize } = require('sequelize');
require('dotenv').config();

async function runMigration() {
    const sequelize = new Sequelize(process.env.DATABASE_URL);
    try {
        console.log("Updating 'shops' table...");
        await sequelize.query("ALTER TABLE shops ADD COLUMN IF NOT EXISTS nik VARCHAR(255);");
        await sequelize.query("ALTER TABLE shops ADD COLUMN IF NOT EXISTS banner_url VARCHAR(255);");
        console.log("Success!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await sequelize.close();
    }
}

runMigration();
