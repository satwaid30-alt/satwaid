/**
 * Migration: Tambah kolom sold_at ke tabel listings
 * Jalankan sekali dengan: node backend/app/database/migrate-listing-sold-at.js
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
            await qi.addColumn('listings', 'sold_at', {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'Waktu produk terjual habis'
            });
            console.log(`✅ Kolom 'sold_at' berhasil ditambahkan.`);
        } catch (err) {
            if (err.message && err.message.includes('already exists')) {
                console.log(`⏭️  Kolom 'sold_at' sudah ada, dilewati.`);
            } else {
                console.error(`❌ Gagal menambahkan kolom 'sold_at':`, err.message);
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
