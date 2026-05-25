const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://postgres:root@localhost:5432/reptile', {
    dialect: 'postgres',
    logging: false
});

async function resetDisbursements() {
    try {
        console.log('Connecting to database and resetting disbursement statuses...');
        
        // Count how many orders are currently in requested/disbursed state
        const [counts] = await sequelize.query(`
            SELECT COUNT(*) as count FROM "public"."orders" 
            WHERE "status" IN ('disbursement_requested', 'disbursed')
        `);
        const targetCount = counts[0]?.count || 0;
        
        if (targetCount === 0) {
            console.log('Tidak ada pesanan berstatus "disbursement_requested" atau "disbursed" untuk direset.');
            process.exit(0);
        }

        // Reset the orders
        const [results, metadata] = await sequelize.query(`
            UPDATE "public"."orders" 
            SET "status" = 'completed', 
                "disbursed_at" = NULL, 
                "disbursement_requested_at" = NULL, 
                "disbursement_proof" = NULL, 
                "disbursement_notes" = NULL, 
                "additional_fee" = 0 
            WHERE "status" IN ('disbursement_requested', 'disbursed')
        `);

        console.log(`Sukses! ${targetCount} data pesanan berhasil direset kembali ke status "completed" (Siap diajukan kembali).`);
        process.exit(0);
    } catch (err) {
        console.error('Error resetting database:', err.message);
        process.exit(1);
    }
}

resetDisbursements();
