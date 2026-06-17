const { Sequelize } = require('sequelize');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function dumpSatwa() {
    const sequelize = new Sequelize(process.env.DATABASE_URL, {
        logging: false
    });

    try {
        console.log("Checking if table satwa_dilindungi exists...");
        
        // Fetch all tables to see if it exists
        const tables = await sequelize.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `, { type: Sequelize.QueryTypes.SELECT });
        
        console.log("Tables found:", tables.map(t => t.table_name).join(', '));
        
        const hasTable = tables.some(t => t.table_name === 'satwa_dilindungi');
        if (!hasTable) {
            console.log("Table 'satwa_dilindungi' not found in public schema. Let's look for schemas...");
            const schemas = await sequelize.query(`
                SELECT schema_name FROM information_schema.schemata
            `, { type: Sequelize.QueryTypes.SELECT });
            console.log("Schemas found:", schemas.map(s => s.schema_name).join(', '));
            return;
        }

        // Query the columns
        const columns = await sequelize.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'satwa_dilindungi'
        `, { type: Sequelize.QueryTypes.SELECT });
        
        console.log("Columns of satwa_dilindungi:", columns);

        // Fetch data
        console.log("Fetching data from satwa_dilindungi...");
        const data = await sequelize.query(`
            SELECT * FROM satwa_dilindungi
        `, { type: Sequelize.QueryTypes.SELECT });

        console.log(`Found ${data.length} rows.`);

        // Save data to backup JSON file in database/backup_satwa_dilindungi.json
        const backupDir = path.join(__dirname, '..', 'database');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        const backupPath = path.join(backupDir, 'backup_satwa_dilindungi.json');
        fs.writeFileSync(backupPath, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`Backup saved to ${backupPath}`);

        // Write a SQL backup as well for absolute safety
        const backupSqlPath = path.join(backupDir, 'backup_satwa_dilindungi.sql');
        // Let's generate simple INSERT statements
        let sqlContent = `-- Backup satwa_dilindungi table\n`;
        sqlContent += `DROP TABLE IF EXISTS "satwa_dilindungi";\n`;
        sqlContent += `CREATE TABLE "satwa_dilindungi" (\n`;
        sqlContent += columns.map(c => `  "${c.column_name}" ${c.data_type === 'integer' ? 'SERIAL' : c.data_type === 'timestamp with time zone' ? 'TIMESTAMPTZ' : c.data_type === 'uuid' ? 'UUID' : 'TEXT'}`).join(',\n') + `,\n  PRIMARY KEY ("id")\n);\n\n`;
        
        for (const row of data) {
            const keys = Object.keys(row);
            const vals = keys.map(k => {
                const val = row[k];
                if (val === null || val === undefined) return 'NULL';
                if (typeof val === 'number' || typeof val === 'boolean') return val;
                return `'${String(val).replace(/'/g, "''")}'`;
            });
            sqlContent += `INSERT INTO "satwa_dilindungi" (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${vals.join(', ')});\n`;
        }
        fs.writeFileSync(backupSqlPath, sqlContent, 'utf-8');
        console.log(`SQL Backup saved to ${backupSqlPath}`);

    } catch (err) {
        console.error("Error during dump:", err);
    } finally {
        await sequelize.close();
    }
}

dumpSatwa();
