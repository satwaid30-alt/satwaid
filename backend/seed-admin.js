const { Sequelize } = require('sequelize');
const crypto = require('crypto');
require('dotenv').config();

function hashPasswordWithMD5(password) {
    return crypto.createHash('md5').update(password).digest('hex');
}

const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres'
});

// Since I can't easily run a script that imports the models without setup, 
// I'll just run a raw query to insert an admin if the table exists.

async function seedAdmin() {
    try {
        const username = 'admin';
        const password = hashPasswordWithMD5('admin123');
        const name = 'Admin SatwaiD';

        console.log(`Seeding admin user: ${username} / admin123`);

        await sequelize.query(`
            INSERT INTO public.users (id, name, username, password, role, created_at)
            VALUES (gen_random_uuid(), '${name}', '${username}', '${password}', 'admin', NOW())
            ON CONFLICT (username) DO NOTHING;
        `);

        console.log('Admin user seeded successfully (if it didn\'t exist).');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding admin:', err);
        process.exit(1);
    }
}

seedAdmin();
