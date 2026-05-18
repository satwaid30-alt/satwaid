const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
});

async function addShippingProofColumn() {
    try {
        console.log('Adding shipping_proof column to orders table...');
        
        // Add the column if it doesn't exist
        await sequelize.query('ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "shipping_proof" VARCHAR(255)');
        
        console.log('Success! Column "shipping_proof" added.');
        process.exit(0);
    } catch (err) {
        console.error('Error adding column:', err.message);
        process.exit(1);
    }
}

addShippingProofColumn();
