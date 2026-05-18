/**
 * Migration: Add shop_code column to shops table
 * Run once: node app/database/migrate-shop-code.js
 */
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL);

async function generateShopCode() {
    const prefix = 'TK';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = prefix;
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

async function migrate() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected');

        const queryInterface = sequelize.getQueryInterface();

        // Check if column already exists
        const tableDesc = await queryInterface.describeTable('shops');
        if (tableDesc.shop_code) {
            console.log('⚠️  Column shop_code already exists, skipping migration.');
        } else {
            await queryInterface.addColumn('shops', 'shop_code', {
                type: DataTypes.STRING(20),
                allowNull: true,
                unique: true,
                after: 'id'
            });
        }

        // ALWAYS Backfill existing shops with unique codes if they are NULL
        const [shops] = await sequelize.query('SELECT id FROM shops WHERE shop_code IS NULL');
        if (shops.length > 0) {
            console.log(`📋 Backfilling ${shops.length} existing shops with codes...`);
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

            for (const shop of shops) {
                let code;
                let isUnique = false;
                while (!isUnique) {
                    let random = '';
                    for (let i = 0; i < 8; i++) {
                        random += chars.charAt(Math.floor(Math.random() * chars.length));
                    }
                    code = `TK-${random}`;
                    const [existing] = await sequelize.query(
                        `SELECT id FROM shops WHERE shop_code = '${code}'`
                    );
                    if (existing.length === 0) isUnique = true;
                }
                await sequelize.query(
                    `UPDATE shops SET shop_code = '${code}' WHERE id = '${shop.id}'`
                );
                console.log(`  → Shop ${shop.id} → ${code}`);
            }
            console.log('✅ Backfill complete');
        } else {
            console.log('✨ All shops already have shop codes.');
        }

        await sequelize.close();
        console.log('✅ Migration done');
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

migrate();
