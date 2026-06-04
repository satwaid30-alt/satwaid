const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres'
});

async function updateAdminName() {
    try {
        console.log("Updating admin name...");
        await sequelize.query(`
            UPDATE public.users
            SET name = 'Admin SatwaiD'
            WHERE username = 'admin';
        `);
        console.log('Admin user updated successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error updating admin:', err);
        process.exit(1);
    }
}

updateAdminName();
