const { Sequelize } = require('sequelize');
require('dotenv').config({ path: './backend/.env' });

const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres'
});

async function check() {
    try {
        const [listings] = await sequelize.query("SELECT id, name, status, shop_id FROM listings");
        const [shops] = await sequelize.query("SELECT id, name, status FROM shops");
        
        console.log("=== LISTINGS ===");
        console.table(listings);
        
        console.log("\n=== SHOPS ===");
        console.table(shops);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
