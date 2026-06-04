const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: console.log
});

async function runMigration() {
    try {
        console.log('Adding payment_rejection_reason column to orders table...');
        await sequelize.query('ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "payment_rejection_reason" TEXT;');
        console.log('Successfully added payment_rejection_reason column.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
