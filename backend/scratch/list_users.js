const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL);

async function run() {
  try {
    const [users] = await sequelize.query(`
      SELECT u.id, u.name, u.username, u.role, s.id as shop_id, s.name as shop_name
      FROM public.users u
      LEFT JOIN public.shops s ON s.user_id = u.id
      LIMIT 10;
    `);
    console.log("Users and Shops:");
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
