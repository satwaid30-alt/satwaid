const { Sequelize } = require('sequelize');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  logging: false
});

async function main() {
  try {
    console.log("Checking satwa_dilindungi table in DB...");
    
    // Check if table exists
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'satwa_dilindungi'
    `);
    
    if (tables.length === 0) {
      console.log("Table 'satwa_dilindungi' does not exist in the database!");
      
      // Let's print out what tables DO exist so we can see if there is a similar table
      const [allTables] = await sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      console.log("Existing tables:", allTables.map(t => t.table_name));
      process.exit(0);
    }
    
    // Fetch columns
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'satwa_dilindungi'
    `);
    console.log("Columns of satwa_dilindungi:", columns.map(c => `${c.column_name} (${c.data_type})`));
    
    // Ensure 'elang' is added to satwa_dilindungi
    const [exists] = await sequelize.query(`
      SELECT id FROM satwa_dilindungi WHERE nama_hewan = 'elang' LIMIT 1
    `);
    
    if (exists.length === 0) {
      const [maxResult] = await sequelize.query(`
        SELECT COALESCE(MAX(id), 0) as max_id FROM satwa_dilindungi
      `);
      const nextId = Number(maxResult[0].max_id) + 1;
      
      console.log(`Inserting 'elang' with ID ${nextId}...`);
      await sequelize.query(`
        INSERT INTO satwa_dilindungi (id, nama_hewan, created_at, updated_at)
        VALUES (:id, 'elang', NOW(), NOW())
      `, {
        replacements: { id: nextId }
      });
    } else {
      console.log("'elang' already exists in satwa_dilindungi.");
    }
    
    // Fetch data
    const [rows] = await sequelize.query("SELECT * FROM satwa_dilindungi ORDER BY id ASC;");
    console.log(`Found ${rows.length} rows in satwa_dilindungi.`);
    if (rows.length > 0) {
      console.log("Sample row:", rows[0]);
    }
    
    // Backup directory
    const backupDir = path.join(__dirname, 'database');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // JSON Backup
    fs.writeFileSync(
      path.join(backupDir, 'backup_satwa_dilindungi.json'), 
      JSON.stringify(rows, null, 2), 
      'utf-8'
    );
    console.log("JSON backup created in database/backup_satwa_dilindungi.json");
    
    // Create seed file in database/seeders
    const seedersDir = path.join(backupDir, 'seeders');
    if (!fs.existsSync(seedersDir)) {
      fs.mkdirSync(seedersDir, { recursive: true });
    }
    
    // Generate Sequelize Seeder file
    const seederFilename = `${Date.now()}-seed-satwa-dilindungi.js`; // or a fixed date prefix like 20260617000000
    const fixedPrefix = '20260617155100';
    const seederPath = path.join(seedersDir, `${fixedPrefix}-seed-satwa-dilindungi.js`);
    
    const seederContent = `'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('satwa_dilindungi', ${JSON.stringify(rows, null, 2)}, {});
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('satwa_dilindungi', null, {});
  }
};
`;
    fs.writeFileSync(seederPath, seederContent, 'utf-8');
    console.log(`Sequelize seeder created at database/seeders/${fixedPrefix}-seed-satwa-dilindungi.js`);
    
    // Generate SQL backup file
    let sqlContent = `-- Backup satwa_dilindungi\n`;
    sqlContent += `DROP TABLE IF EXISTS "satwa_dilindungi";\n`;
    sqlContent += `CREATE TABLE "satwa_dilindungi" (\n`;
    sqlContent += columns.map(c => {
      let type = 'TEXT';
      if (c.data_type === 'integer') type = 'SERIAL';
      else if (c.data_type === 'timestamp with time zone') type = 'TIMESTAMPTZ';
      else if (c.data_type === 'uuid') type = 'UUID';
      else if (c.data_type === 'boolean') type = 'BOOLEAN';
      return `  "${c.column_name}" ${type}`;
    }).join(',\n') + `,\n  PRIMARY KEY ("id")\n);\n\n`;
    
    for (const r of rows) {
      const keys = Object.keys(r);
      const vals = keys.map(k => {
        const val = r[k];
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'number' || typeof val === 'boolean') return val;
        return `'${String(val).replace(/'/g, "''")}'`;
      });
      sqlContent += `INSERT INTO "satwa_dilindungi" (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${vals.join(', ')});\n`;
    }
    
    fs.writeFileSync(path.join(backupDir, 'backup_satwa_dilindungi.sql'), sqlContent, 'utf-8');
    console.log("SQL backup created in database/backup_satwa_dilindungi.sql");
    
    process.exit(0);
  } catch (err) {
    console.error("Database connection/query error:", err);
    process.exit(1);
  }
}

main();
