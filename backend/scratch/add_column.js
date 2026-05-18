const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL);

async function addColumn() {
    try {
        await sequelize.query('ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;');
        console.log('Column is_read added to comments table');
    } catch (err) {
        console.error('Error adding column:', err);
    } finally {
        await sequelize.close();
    }
}

addColumn();
