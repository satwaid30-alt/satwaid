const { Sequelize } = require('sequelize');
const initModels = require('../database/init');
const sequelize = new Sequelize(process.env.DATABASE_URL);
var models = initModels(sequelize);

module.exports = {
    getCommentsByTopic: async (req, res) => {
        try {
            const { topic_id } = req.params;
            
            const comments = await models.comments.findAll({
                where: { topic_id },
                include: [{
                    model: models.users,
                    as: 'author',
                    attributes: ['id', 'username', 'name', 'avatar_url']
                }],
                order: [['created_at', 'ASC']]
            });
            
            res.status(200).json({ message: "Success", data: comments });
        } catch (error) {
            console.error("Error fetching comments:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
};
