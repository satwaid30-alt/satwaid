require('dotenv').config();
const { Sequelize } = require("sequelize");

const dbUrl = process.env.DATABASE_URL || "postgres://postgres:root@localhost:5432/reptile";
const seq = new Sequelize(dbUrl, {
  logging: false,
});

async function run() {
  try {
    // Find the latest active auction
    const [listings] = await seq.query(
      `SELECT id, product_id, name, status, start_date, end_date 
       FROM listings 
       WHERE type = 'auction' AND status = 'active' 
       ORDER BY created_at DESC 
       LIMIT 1`
    );

    if (listings.length === 0) {
      console.log("❌ Tidak ada lelang aktif (status = 'active') di database.");
      console.log("Silakan buat lelang baru atau aktifkan lelang yang ada terlebih dahulu.");
      return;
    }

    const target = listings[0];
    console.log(`Found active auction: "${target.name}" (${target.product_id})`);
    console.log(`Current end date: ${target.end_date}`);

    // Update it to expire in 1 minute
    const [rows] = await seq.query(
      `UPDATE listings 
       SET start_date = NOW() - INTERVAL '1 hour', 
           end_date   = NOW() + INTERVAL '1 minute'
       WHERE id = :id
       RETURNING product_id, name, start_date, end_date, status`,
      {
        replacements: { id: target.id }
      }
    );

    console.log("✅ Berhasil memperbarui sisa waktu lelang!");
    console.log(JSON.stringify(rows[0], null, 2));
    console.log("\nSilakan buka halaman detail lelang di browser dan pasang bid / tunggu hingga timer habis (1 menit) untuk menguji real-time notification.");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await seq.close();
  }
}

run();
