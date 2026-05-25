const { Sequelize } = require('sequelize');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  logging: console.log
});

async function main() {
  try {
    console.log("Connecting to database...");
    await sequelize.authenticate();
    console.log("Connected. Dropping tables 'species' and 'morph_groups' cascade...");
    await sequelize.query('DROP TABLE IF EXISTS "species" CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS "morph_groups" CASCADE;');
    console.log("Tables 'species' and 'morph_groups' dropped successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error executing query:", error);
    process.exit(1);
  }
}

main();
