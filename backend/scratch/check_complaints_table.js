const { Sequelize } = require('sequelize');
require('dotenv').config();

async function check() {
  const sequelize = new Sequelize(process.env.DATABASE_URL);
  try {
    await sequelize.authenticate();
    console.log('Database connection authenticated.');
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'complaints';
    `);
    console.log('Query result:', results);
    if (results.length > 0) {
      console.log('SUCCESS: complaints table exists!');
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'complaints';
      `);
      console.log('Columns:');
      columns.forEach(col => console.log(` - ${col.column_name}: ${col.data_type}`));
    } else {
      console.error('ERROR: complaints table does NOT exist yet.');
    }
  } catch (error) {
    console.error('Error occurred:', error);
  } finally {
    await sequelize.close();
  }
}

check();
