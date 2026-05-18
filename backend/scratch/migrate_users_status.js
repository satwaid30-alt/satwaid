const { Sequelize } = require('sequelize');
require('dotenv').config();

async function runMigration() {
    const sequelize = new Sequelize(process.env.DATABASE_URL);
    try {
        console.log("Adding 'status' column to 'users' table...");
        await sequelize.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(255) DEFAULT 'active';");
        console.log("Success!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await sequelize.close();
    }
}

runMigration();
