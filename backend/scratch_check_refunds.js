const { Sequelize } = require('sequelize');
require('dotenv').config();
const initModels = require('./app/database/init');

async function checkRefunds() {
    const sequelize = new Sequelize(process.env.DATABASE_URL);
    const models = initModels(sequelize);

    try {
        const cancelledOrders = await models.orders.findAll({
            where: {
                status: 'cancelled'
            },
            attributes: ['id', 'order_id', 'status', 'refund_status', 'refund_proof', 'refund_notes']
        });

        console.log(`Found ${cancelledOrders.length} cancelled orders:`);
        cancelledOrders.forEach(o => {
            console.log(JSON.stringify(o.toJSON(), null, 2));
        });
    } catch (err) {
        console.error(err);
    } finally {
        await sequelize.close();
    }
}

checkRefunds();
