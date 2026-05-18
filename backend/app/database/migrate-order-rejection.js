/**
 * Migration: Tambah kolom rejection_reason ke tabel orders
 * Jalankan sekali dengan: node backend/app/database/migrate-order-rejection.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    logging: false
});

async function migrate() {
    try {
        await sequelize.authenticate();
        console.log('✅ Koneksi database berhasil.\n');

        const qi = sequelize.getQueryInterface();

        try {
            await qi.addColumn('orders', 'rejection_reason', {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Alasan pembatalan dari penjual'
            });
            console.log(`✅ Kolom 'rejection_reason' berhasil ditambahkan.`);
        } catch (err) {
            if (err.message && err.message.includes('already exists')) {
                console.log(`⏭️  Kolom 'rejection_reason' sudah ada, dilewati.`);
            } else {
                console.error(`❌ Gagal menambahkan kolom 'rejection_reason':`, err.message);
            }
        }

        console.log('\n🎉 Migrasi selesai!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Koneksi gagal:', err.message);
        process.exit(1);
    }
}

migrate();
