const { Sequelize } = require('sequelize');
require('dotenv').config();
const initModels = require('./app/database/init');

async function checkData() {
    const sequelize = new Sequelize(process.env.DATABASE_URL);
    const models = initModels(sequelize);

    try {
        const listings = await models.listings.findAll({
            attributes: ['id', 'name', 'status', 'species']
        });

        console.log(`Total Listings: ${listings.length}`);
        listings.forEach(l => {
            console.log(`- [${l.status}] ${l.name} (${l.species})`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await sequelize.close();
    }
}

checkData();
