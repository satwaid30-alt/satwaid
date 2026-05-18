require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL);

async function alterTable() {
    try {
        await sequelize.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;');
        console.log("Column 'email' added successfully.");
    } catch (error) {
        console.error("Error altering table:", error);
    } finally {
        await sequelize.close();
    }
}

alterTable();
