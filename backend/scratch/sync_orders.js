const { Sequelize } = require('sequelize');
const initModels = require('../app/database/init');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL);
const models = initModels(sequelize);

async function sync() {
    try {
        console.log("Synchronizing Orders table...");
        await models.orders.sync({ alter: true });
        console.log("Orders table synchronized successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error synchronizing table:", error);
        process.exit(1);
    }
}

sync();
