require('dotenv').config();
const { Sequelize } = require("sequelize");
const seq = new Sequelize(process.env.DATABASE_URL, {
  logging: false,
});

async function main() {
  try {
    console.log("Connecting using database URL:", process.env.DATABASE_URL);
    await seq.authenticate();
    console.log("Connection established successfully.");
    const [rows] = await seq.query(
      `SELECT id, product_id, name, type, status, start_date, end_date FROM listings WHERE type = 'auction' ORDER BY created_at DESC LIMIT 5`
    );
    console.log("Found listings count:", rows.length);
    console.log(JSON.stringify(rows, null, 2));
  } catch (error) {
    console.error("Database error:", error);
  } finally {
    await seq.close();
    console.log("Database connection closed.");
  }
}

main();
