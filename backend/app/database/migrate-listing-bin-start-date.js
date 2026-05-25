/**
 * Migration: Tambah kolom bin_price dan start_date ke tabel listings
 * Jalankan sekali dengan: node backend/app/database/migrate-listing-bin-start-date.js
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

        // 1. Add bin_price column
        try {
            await qi.addColumn('listings', 'bin_price', {
                type: Sequelize.BIGINT,
                allowNull: true,
                comment: 'Harga Beli Sekarang (Buy It Now)'
            });
            console.log(`✅ Kolom 'bin_price' berhasil ditambahkan.`);
        } catch (err) {
            if (err.message && err.message.includes('already exists')) {
                console.log(`⏭️  Kolom 'bin_price' sudah ada, dilewati.`);
            } else {
                console.error(`❌ Gagal menambahkan kolom 'bin_price':`, err.message);
            }
        }

        // 2. Add start_date column
        try {
            await qi.addColumn('listings', 'start_date', {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'Waktu mulai lelang'
            });
            console.log(`✅ Kolom 'start_date' berhasil ditambahkan.`);
        } catch (err) {
            if (err.message && err.message.includes('already exists')) {
                console.log(`⏭️  Kolom 'start_date' sudah ada, dilewati.`);
            } else {
                console.error(`❌ Gagal menambahkan kolom 'start_date':`, err.message);
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
