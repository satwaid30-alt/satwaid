require('dotenv').config();
const { Sequelize } = require('sequelize');
const initModels = require('./app/database/init');
const sequelize = new Sequelize(process.env.DATABASE_URL);
const models = initModels(sequelize);

async function check() {
  try {
    const users = await models.users.findAll({ raw: true });
    console.log(JSON.stringify(users.map(u => ({
      id: u.id,
      username: u.username,
      name: u.name,
      phone: u.phone,
      address: u.address,
      city: u.city,
      province: u.province,
      bank_accounts: u.bank_accounts
    })), null, 2));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
check();
