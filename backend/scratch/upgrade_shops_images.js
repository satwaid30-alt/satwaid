const { Sequelize } = require('sequelize');
require('dotenv').config();

async function runMigration() {
    const sequelize = new Sequelize(process.env.DATABASE_URL);
    try {
        console.log("Upgrading 'shops' table image columns...");
        await sequelize.query("ALTER TABLE shops ALTER COLUMN logo_url TYPE TEXT;");
        await sequelize.query("ALTER TABLE shops ALTER COLUMN banner_url TYPE TEXT;");
        console.log("Success!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await sequelize.close();
    }
}

runMigration();
