const { Sequelize } = require('sequelize');
require('dotenv').config();
const initModels = require('./app/database/init');

const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: console.log
});

const models = initModels(sequelize);

async function migrate() {
    try {
        console.log('Starting migration (syncing models to database)...');
        
        // This will create tables if they don't exist
        // WARNING: { alter: true } will try to match the table to the model
        await sequelize.sync({ alter: true });
        
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
