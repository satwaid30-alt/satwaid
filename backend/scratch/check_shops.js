const { Sequelize } = require("sequelize");
const seq = new Sequelize("postgres://postgres:root@localhost:5432/reptile", {
  logging: false,
});

async function main() {
  try {
    console.log("Connecting to database...");
    await seq.authenticate();
    console.log("Connection established successfully.");
    const [rows] = await seq.query(
      `SELECT id, name, logo_url, status FROM shops`
    );
    console.log(`Found ${rows.length} shops:`);
    rows.forEach(r => {
      console.log(`- Shop: ${r.name}`);
      console.log(`  ID: ${r.id}`);
      console.log(`  Status: ${r.status}`);
      console.log(`  Logo URL: ${r.logo_url ? (r.logo_url.substring(0, 100) + (r.logo_url.length > 100 ? '...' : '')) : 'NULL'}`);
      console.log('---');
    });
  } catch (error) {
    console.error("Database connection/query error:", error);
  } finally {
    await seq.close();
    console.log("Database connection closed.");
  }
}

main();
