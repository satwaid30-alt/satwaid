require('dotenv').config();
const { Sequelize } = require('sequelize');
const initModels = require('../app/database/init');
const sequelize = new Sequelize(process.env.DATABASE_URL);
const models = initModels(sequelize);

async function check() {
  try {
    const tableDesc = await sequelize.getQueryInterface().describeTable('complaint_comments');
    console.log('Table schema:', tableDesc);
    
    const count = await models.complaint_comments.count();
    console.log('Total comments in table:', count);
  } catch (err) {
    console.error('Database error details:', err.message);
  }
  process.exit(0);
}
check();
