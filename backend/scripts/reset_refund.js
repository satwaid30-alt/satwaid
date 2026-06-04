require('dotenv').config();
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL);

(async () => {
  try {
    const [results] = await sequelize.query(`
      UPDATE public.orders
      SET refund_status = NULL,
          bank_name = NULL,
          bank_account = NULL,
          bank_holder = NULL,
          refund_proof = NULL,
          refund_notes = NULL,
          refunded_at = NULL,
          updated_at = NOW()
      WHERE order_id = 'INV/20260604/RH/850919'
      RETURNING id, order_id, status, refund_status, bank_account
    `);

    if (results.length > 0) {
      console.log('SUCCESS - Order berhasil direset ke tahap awal:');
      console.log(JSON.stringify(results[0], null, 2));
    } else {
      console.log('NOT FOUND - Order INV/20260604/RH/850919 tidak ditemukan di database');
    }
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await sequelize.close();
  }
})();
