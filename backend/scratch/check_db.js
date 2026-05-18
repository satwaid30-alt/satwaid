const { Sequelize } = require('sequelize');
require('dotenv').config();

async function checkColumns() {
    const sequelize = new Sequelize(process.env.DATABASE_URL);
    try {
        const [results] = await sequelize.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
        console.log("Columns in 'users' table:", results.map(r => r.column_name));
        
        const [shopsResults] = await sequelize.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'shops'");
        console.log("Columns in 'shops' table:", shopsResults.map(r => r.column_name));
    } catch (err) {
        console.error(err);
    } finally {
        await sequelize.close();
    }
}

checkColumns();
