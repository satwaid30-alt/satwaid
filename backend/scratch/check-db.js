const { Sequelize } = require('sequelize');
const initModels = require('../app/database/init');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL);
const models = initModels(sequelize);

async function check() {
  try {
    console.log("Checking settings table...");
    const tables = await sequelize.getQueryInterface().showAllSchemas();
    console.log("Schemas/Tables verified.");
    
    // Check if table settings exists
    const settingsCount = await models.settings.count().catch(err => {
      console.error("Count settings failed:", err.message);
      return -1;
    });
    console.log("Settings count:", settingsCount);

    if (settingsCount === -1) {
      console.log("Attempting to sync settings model specifically...");
      await models.settings.sync({ alter: true });
      console.log("Settings model synced successfully.");
      const retryCount = await models.settings.count();
      console.log("Settings count after sync:", retryCount);
    }
  } catch (error) {
    console.error("Error during check:", error);
  } finally {
    await sequelize.close();
  }
}

check();
