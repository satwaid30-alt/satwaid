/**
 * Migration: Tambah kolom timestamp per tahap transaksi ke tabel orders
 * Jalankan sekali dengan: node backend/app/database/migrate-order-timestamps.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    logging: false
});

const newColumns = [
    { name: 'address_filled_at',    comment: 'Waktu pembeli mengisi data pengiriman' },
    { name: 'shipping_cost_set_at', comment: 'Waktu seller menetapkan ongkos kirim' },
    { name: 'payment_uploaded_at',  comment: 'Waktu pembeli mengunggah bukti bayar' },
    { name: 'payment_verified_at',  comment: 'Waktu admin memverifikasi pembayaran' },
    { name: 'shipped_at',           comment: 'Waktu seller menginput resi dan mengirim barang' },
    { name: 'completed_at',         comment: 'Waktu pembeli mengonfirmasi penerimaan barang' },
    { name: 'cancelled_at',         comment: 'Waktu pesanan dibatalkan' },
];

async function migrate() {
    try {
        await sequelize.authenticate();
        console.log('✅ Koneksi database berhasil.\n');

        const qi = sequelize.getQueryInterface();

        for (const col of newColumns) {
            try {
                await qi.addColumn('orders', col.name, {
                    type: Sequelize.DATE,
                    allowNull: true,
                    comment: col.comment
                });
                console.log(`✅ Kolom '${col.name}' berhasil ditambahkan.`);
            } catch (err) {
                if (err.message && err.message.includes('already exists')) {
                    console.log(`⏭️  Kolom '${col.name}' sudah ada, dilewati.`);
                } else {
                    console.error(`❌ Gagal menambahkan kolom '${col.name}':`, err.message);
                }
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
