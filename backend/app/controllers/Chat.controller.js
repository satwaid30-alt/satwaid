const { Sequelize, Op } = require('sequelize');
const initModels = require('../database/init');
const sequelize = new Sequelize(process.env.DATABASE_URL);
var models = initModels(sequelize);

module.exports = {
    findOrCreateChat: async (req, res) => {
        try {
            const { buyer_id, seller_id, product_id } = req.body;

            if (!buyer_id || !seller_id || !product_id) {
                return res.status(400).json({ message: "Buyer ID, Seller ID, and Product ID are required" });
            }

            // Look for an existing chat for this specific product, buyer and seller
            let chat = await models.chats.findOne({
                where: {
                    buyer_id,
                    seller_id,
                    listing_id: product_id
                }
            });

            if (!chat) {
                // Create new chat
                chat = await models.chats.create({
                    buyer_id,
                    seller_id,
                    listing_id: product_id
                });
            }

            res.status(200).json({ message: "Success", data: chat });
        } catch (error) {
            console.error("Error in findOrCreateChat details:", {
                message: error.message,
                stack: error.stack,
                name: error.name,
                errors: error.errors // Sequelize specific validation errors
            });
            res.status(500).json({ message: "Internal server error" });
        }
    },

    getChatMessages: async (req, res) => {
        try {
            const { chat_id } = req.params;
            const messages = await models.chat_messages.findAll({
                where: { chat_id },
                include: [{
                    model: models.users,
                    as: 'sender',
                    attributes: ['id', 'username', 'name', 'avatar_url']
                }],
                order: [['created_at', 'ASC']]
            });
            res.status(200).json({ message: "Success", data: messages });
        } catch (error) {
            console.error("Error fetching chat messages:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    getUserChats: async (req, res) => {
        try {
            const { user_id } = req.params;
            const chats = await models.chats.findAll({
                where: {
                    [Op.or]: [
                        { buyer_id: user_id },
                        { seller_id: user_id }
                    ]
                },
                include: [
                    { model: models.users, as: 'buyer', attributes: ['id', 'name', 'username', 'avatar_url'] },
                    { model: models.users, as: 'seller', attributes: ['id', 'name', 'username', 'avatar_url'] },
                    { model: models.listings, as: 'product', attributes: ['id', 'name', 'images', 'price'] }
                ],
                order: [['updated_at', 'DESC'], ['created_at', 'DESC']]
            });
            res.status(200).json({ message: "Success", data: chats });
        } catch (error) {
            console.error("Error fetching user chats:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    getSellerChats: async (req, res) => {
        try {
            const { seller_id } = req.params;
            const chats = await models.chats.findAll({
                where: { seller_id },
                include: [
                    { model: models.users, as: 'buyer', attributes: ['id', 'name', 'username', 'avatar_url'] },
                    { model: models.listings, as: 'product', attributes: ['id', 'name', 'images', 'price'] }
                ],
                order: [['updated_at', 'DESC'], ['created_at', 'DESC']]
            });
            res.status(200).json({ message: "Success", data: chats });
        } catch (error) {
            console.error("Error in getSellerChats:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    getProductChatCount: async (req, res) => {
        try {
            const { product_id } = req.params;
            const count = await models.chats.count({
                where: { listing_id: product_id }
            });
            res.status(200).json({ message: "Success", data: count });
        } catch (error) {
            console.error("Error in getProductChatCount:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
};
