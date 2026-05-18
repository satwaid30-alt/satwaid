const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false
});

async function migrate() {
    try {
        console.log('Starting migration...');
        
        // Add is_free_shipping column
        await sequelize.query('ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_free_shipping BOOLEAN DEFAULT false;');
        console.log('Added is_free_shipping column');

        // Add is_free_packing column
        await sequelize.query('ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_free_packing BOOLEAN DEFAULT false;');
        console.log('Added is_free_packing column');

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
