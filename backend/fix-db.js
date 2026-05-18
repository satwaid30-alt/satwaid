const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
});

async function fixColumn() {
    try {
        console.log('Manually altering species.id column type in PostgreSQL...');
        
        // This is the SQL command to change the column type from UUID to VARCHAR
        await sequelize.query('ALTER TABLE "public"."species" ALTER COLUMN "id" TYPE VARCHAR(100) USING id::varchar');
        
        console.log('Success! Column "id" is now VARCHAR(100).');
        process.exit(0);
    } catch (err) {
        console.error('Error altering column:', err.message);
        process.exit(1);
    }
}

fixColumn();
