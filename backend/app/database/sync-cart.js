const { Sequelize } = require('sequelize');
const initModels = require('./init');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false
});
const models = initModels(sequelize);

async function syncCart() {
    try {
        console.log("Checking database connection...");
        await sequelize.authenticate();
        console.log("Connected to database.");

        console.log("Syncing 'carts' table...");
        await models.carts.sync({ alter: true });
        console.log("Table 'carts' has been created/updated successfully.");

        process.exit(0);
    } catch (error) {
        console.error("Error syncing table:", error);
        process.exit(1);
    }
}

syncCart();
