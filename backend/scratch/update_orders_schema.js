const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL);

async function updateSchema() {
    try {
        console.log("Starting schema update...");
        
        const queryInterface = sequelize.getQueryInterface();
        const tableInfo = await queryInterface.describeTable('orders');
        
        const newColumns = [
            { name: 'receiver_name', type: 'STRING(100)' },
            { name: 'phone_number', type: 'STRING(20)' },
            { name: 'shipping_address', type: 'TEXT' },
            { name: 'shipping_cost', type: 'BIGINT', defaultValue: 0 },
            { name: 'packing_cost', type: 'BIGINT', defaultValue: 0 }
        ];

        for (const col of newColumns) {
            if (!tableInfo[col.name]) {
                console.log(`Adding column: ${col.name}`);
                await queryInterface.addColumn('orders', col.name, {
                    type: Sequelize[col.type.split('(')[0]](col.type.includes('(') ? parseInt(col.type.match(/\d+/)[0]) : undefined),
                    allowNull: true,
                    defaultValue: col.defaultValue !== undefined ? col.defaultValue : null
                });
            } else {
                console.log(`Column ${col.name} already exists.`);
            }
        }

        // Also check if status length needs to be increased
        if (tableInfo.status && tableInfo.status.type.includes('20')) {
            console.log("Increasing status column length...");
            await queryInterface.changeColumn('orders', 'status', {
                type: Sequelize.STRING(30),
                allowNull: false,
                defaultValue: 'pending_shipping_info'
            });
        }

        console.log("Schema update completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Error updating schema:", err);
        process.exit(1);
    }
}

updateSchema();
