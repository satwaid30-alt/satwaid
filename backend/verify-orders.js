const { Sequelize } = require('sequelize');
const initModels = require('./app/database/init');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  logging: false
});
const models = initModels(sequelize);

async function verify() {
  console.log('Verifying order_items table and associations...');
  
  // 1. Check if model is registered
  if (!models.order_items) {
    throw new Error('order_items model not registered in init.js');
  }
  console.log('✔ order_items model is registered.');

  // 2. Check if associations are set up
  const orderAssoc = models.orders.associations;
  if (!orderAssoc.items) {
    throw new Error('Association "items" not defined on orders model');
  }
  console.log('✔ Association "items" is defined on orders.');

  const itemAssoc = models.order_items.associations;
  if (!itemAssoc.order) {
    throw new Error('Association "order" not defined on order_items model');
  }
  if (!itemAssoc.product) {
    throw new Error('Association "product" not defined on order_items model');
  }
  console.log('✔ Associations "order" and "product" are defined on order_items.');

  // 3. Test describe table to ensure table actually exists in the DB
  const tableDesc = await sequelize.getQueryInterface().describeTable('order_items');
  console.log('✔ order_items table exists in the database. Columns:', Object.keys(tableDesc).join(', '));
  
  console.log('Verification successful! Database schema is in sync.');
  process.exit(0);
}

verify().catch(err => {
  console.error('Verification failed:', err.message);
  process.exit(1);
});
