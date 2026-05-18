const { Sequelize } = require('sequelize');
require('dotenv').config({ path: '../../.env' });

const sequelize = new Sequelize(process.env.DATABASE_URL);

async function forceRecovery() {
    try {
        console.log('Memulai pemulihan paksa struktur tabel listings...');
        
        // Hapus tabel lama dan buat baru (karena data kolom sudah hilang/null)
        // Ini adalah cara tercepat untuk mengembalikan struktur yang benar
        await sequelize.query('DROP TABLE IF EXISTS "listings" CASCADE;');
        
        const initModels = require('../database/init');
        const models = initModels(sequelize);
        
        await sequelize.sync();
        
        console.log('Berhasil! Struktur tabel listings telah dikembalikan ke kondisi awal yang benar.');
        process.exit(0);
    } catch (err) {
        console.error('Gagal pemulihan paksa:', err);
        process.exit(1);
    }
}

forceRecovery();
