const { Sequelize, Op } = require('sequelize');
const initModels = require('../database/init');
const sequelize = new Sequelize(process.env.DATABASE_URL);
var models = initModels(sequelize);

module.exports = {
    getTopics: async (req, res) => {
        try {
            const { user_id, status, category } = req.query;
            let whereClause = {};
            
            // By default, exclude category 'Chat' unless specifically requested
            if (category) {
                whereClause.category = category;
            } else {
                whereClause.category = { [Op.ne]: 'Chat' };
            }

            if (user_id) whereClause.user_id = user_id;
            if (status) whereClause.status = status;

            const topics = await models.topics.findAll({
                where: whereClause,
                include: [{
                    model: models.users,
                    as: 'author',
                    attributes: ['id', 'username', 'name', 'avatar_url']
                }, {
                    model: models.topic_likes,
                    as: 'topic_likes',
                    attributes: ['user_id']
                }],
                attributes: {
                    include: [
                        [
                            sequelize.literal('(SELECT COUNT(*) FROM comments WHERE comments.topic_id = topics.id)'),
                            'comment_count'
                        ]
                    ]
                },
                order: [['created_at', 'DESC']]
            });

            // Calculate author reputations
            const authorIds = [...new Set(topics.map(t => t.author?.id).filter(id => id))];
            
            let reputations = {};
            if (authorIds.length > 0) {
                const sums = await models.topics.findAll({
                    where: { user_id: authorIds },
                    attributes: ['user_id', [sequelize.fn('sum', sequelize.col('likes')), 'total_likes']],
                    group: ['user_id']
                });
                
                sums.forEach(s => {
                    reputations[s.user_id] = (parseInt(s.getDataValue('total_likes')) || 0) * 100;
                });
            }

            const formattedTopics = topics.map(topic => {
                const topicJson = topic.toJSON();
                topicJson.replies = parseInt(topicJson.comment_count) || 0;
                if (topicJson.author) {
                    topicJson.author.reputation = reputations[topicJson.author.id] || 0;
                    topicJson.author.stars = Math.min(Math.floor((reputations[topicJson.author.id] || 0) / 3000), 5);
                }
                return topicJson;
            });

            res.status(200).json({ message: "Success", data: formattedTopics });
        } catch (error) {
            console.error("Error getting topics:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    getTopicById: async (req, res) => {
        try {
            const { id } = req.params;
            const topic = await models.topics.findOne({
                where: { id },
                include: [{
                    model: models.users,
                    as: 'author',
                    attributes: ['id', 'username', 'name', 'avatar_url']
                }, {
                    model: models.topic_likes,
                    as: 'topic_likes',
                    attributes: ['user_id']
                }],
                attributes: {
                    include: [
                        [
                            sequelize.literal('(SELECT COUNT(*) FROM comments WHERE comments.topic_id = topics.id)'),
                            'comment_count'
                        ]
                    ]
                }
            });

            if (!topic) return res.status(404).json({ message: "Topik tidak ditemukan" });

            const topicJson = topic.toJSON();
            topicJson.replies = parseInt(topicJson.comment_count) || 0;

            // Calculate reputation for this specific author
            if (topicJson.author) {
                const sum = await models.topics.findOne({
                    where: { user_id: topicJson.author.id },
                    attributes: [[sequelize.fn('sum', sequelize.col('likes')), 'total_likes']],
                });
                
                const totalLikes = parseInt(sum.getDataValue('total_likes')) || 0;
                topicJson.author.reputation = totalLikes * 100;
                topicJson.author.stars = Math.min(Math.floor(topicJson.author.reputation / 3000), 5);
            }

            res.status(200).json({ message: "Success", data: topicJson });
        } catch (error) {
            console.error("Error getting topic by id:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    createTopic: async (req, res) => {
        try {
            const { user_id, title, category, description, date, image } = req.body;
            
            if (!user_id || !title || !category || !description) {
                return res.status(400).json({ message: "Mohon lengkapi data topik" });
            }

            const topic = await models.topics.create({
                user_id,
                title,
                category,
                description,
                image: image || null,
                date: date || new Date(),
                status: 'Pending'
            });

            res.status(201).json({ message: "Topik berhasil dibuat", data: topic });
        } catch (error) {
            console.error("Error creating topic:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    updateTopic: async (req, res) => {
        try {
            const { id } = req.params;
            const { title, category, description, date, image, status, rejection_reason } = req.body;

            const topic = await models.topics.findByPk(id);
            if (!topic) return res.status(404).json({ message: "Topik tidak ditemukan" });

            await topic.update({
                title: title !== undefined ? title : topic.title,
                category: category !== undefined ? category : topic.category,
                description: description !== undefined ? description : topic.description,
                date: date !== undefined ? date : topic.date,
                image: image !== undefined ? image : topic.image,
                status: status !== undefined ? status : topic.status,
                rejection_reason: rejection_reason !== undefined ? rejection_reason : topic.rejection_reason
            });

            res.status(200).json({ message: "Topik berhasil diupdate", data: topic });
        } catch (error) {
            console.error("Error updating topic:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    deleteTopic: async (req, res) => {
        try {
            const { id } = req.params;
            const topic = await models.topics.findByPk(id);
            if (!topic) return res.status(404).json({ message: "Topik tidak ditemukan" });

            // Delete related comments first
            await models.comments.destroy({ where: { topic_id: id } });
            
            // Delete related likes
            await models.topic_likes.destroy({ where: { topic_id: id } });

            // Now delete the topic
            await topic.destroy();
            
            res.status(200).json({ message: "Topik berhasil dihapus" });
        } catch (error) {
            console.error("Error deleting topic:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    toggleLike: async (req, res) => {
        try {
            const { topic_id } = req.params;
            const { user_id } = req.body;

            if (!user_id) return res.status(400).json({ message: "User ID dibutuhkan" });

            const topic = await models.topics.findByPk(topic_id);
            if (!topic) return res.status(404).json({ message: "Topik tidak ditemukan" });

            const existingLike = await models.topic_likes.findOne({
                where: { topic_id, user_id }
            });

            if (existingLike) {
                // Unlike
                await existingLike.destroy();
                await topic.update({ likes: Math.max(0, (topic.likes || 0) - 1) });
                res.status(200).json({ message: "Unliked", likes: topic.likes, has_liked: false });
            } else {
                // Like
                await models.topic_likes.create({ topic_id, user_id });
                await topic.update({ likes: (topic.likes || 0) + 1 });
                res.status(200).json({ message: "Liked", likes: topic.likes, has_liked: true });
            }
        } catch (error) {
            console.error("Error toggling like:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
};
