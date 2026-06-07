const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/blog_reptile', {
  logging: false
});

async function main() {
  try {
    console.log("Checking complaints and complaint comments in DB...");
    const [complaints] = await sequelize.query("SELECT id, user_id, title, status FROM complaints LIMIT 5;");
    console.log("\nComplaints:");
    console.log(complaints);

    const [comments] = await sequelize.query("SELECT id, complaint_id, user_id, content, created_at FROM complaint_comments LIMIT 5;");
    console.log("\nComplaint Comments:");
    console.log(comments);

    process.exit(0);
  } catch (err) {
    console.error("Database connection/query error:", err);
    process.exit(1);
  }
}

main();
