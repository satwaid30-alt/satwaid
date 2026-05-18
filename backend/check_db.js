const { Sequelize } = require('sequelize');
require('dotenv').config();
const initModels = require('./app/database/init');

async function checkData() {
    const sequelize = new Sequelize(process.env.DATABASE_URL);
    const models = initModels(sequelize);

    try {
        const topicCount = await models.topics.count();
        const commentCount = await models.comments.count();
        const chatMessageCount = await models.chat_messages.count();

        console.log(`Topics: ${topicCount}`);
        console.log(`Comments: ${commentCount}`);
        console.log(`Chat Messages: ${chatMessageCount}`);

        const topTopics = await models.topics.findAll({
            limit: 5,
            attributes: ['id', 'title']
        });

        for (const topic of topTopics) {
            const count = await models.comments.count({ where: { topic_id: topic.id } });
            console.log(`Topic "${topic.title}" (ID: ${topic.id}) has ${count} comments.`);
        }
        
        // Check if any chat_messages might be misplaced topic comments
        // (i.e. chat_id exists in topics but not in chats)
        const misplaced = await sequelize.query(`
            SELECT count(*) as count 
            FROM chat_messages 
            WHERE chat_id NOT IN (SELECT id FROM chats)
            AND chat_id IN (SELECT id FROM topics)
        `, { type: Sequelize.QueryTypes.SELECT });
        
        console.log(`Misplaced comments (in chat_messages): ${misplaced[0].count}`);

    } catch (err) {
        console.error(err);
    } finally {
        await sequelize.close();
    }
}

checkData();
