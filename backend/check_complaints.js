const { Sequelize } = require('sequelize');
require('dotenv').config();
const initModels = require('./app/database/init');

async function testComplaints() {
    const sequelize = new Sequelize(process.env.DATABASE_URL);
    const models = initModels(sequelize);

    try {
        const complaints = await models.complaints.findAll({
          attributes: {
            include: [
              [
                Sequelize.literal(`(
                  SELECT COUNT(*)
                  FROM complaint_comments AS comments
                  WHERE comments.complaint_id = complaints.id
                )`),
                "comments_count"
              ]
            ]
          },
          order: [["created_at", "DESC"]],
          limit: 5
        });
        console.log("SUCCESS FETCHING COMPLAINTS:");
        console.log(JSON.stringify(complaints, null, 2));
    } catch (err) {
        console.error("ERROR FETCHING COMPLAINTS:");
        console.error(err);
    } finally {
        await sequelize.close();
    }
}

testComplaints();
