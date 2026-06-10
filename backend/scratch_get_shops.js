const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/blog_reptile', {
  logging: false
});

async function main() {
  try {
    const [shops] = await sequelize.query("SELECT id, name FROM shops LIMIT 5;");
    console.log("Shops:", shops);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}
main();
