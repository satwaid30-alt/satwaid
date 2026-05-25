const { Sequelize, Op } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL);
const initModels = require('../database/init');
var models = initModels(sequelize);

const ORDER_STATUS_LABELS = {
    'pending_shipping_info': 'Menunggu Alamat Pengiriman',
    'waiting_shipping_cost': 'Menunggu Biaya Kirim',
    'waiting_payment': 'Menunggu Pembayaran',
    'processing': 'Sedang Diproses',
    'payment_verified': 'Pembayaran Terverifikasi',
    'shipped': 'Sedang Dikirim',
    'completed': 'Selesai',
    'cancelled': 'Dibatalkan',
    'complained': 'Komplain',
};

module.exports.getNotificationCounts = async (req, res, next) => {
    try {
        const { user_id } = req.params;
        if (!user_id) return res.status(400).json({ message: "User ID is required" });

        const shop = await models.shops.findOne({ where: { user_id } });
        const shopId = shop ? shop.id : null;

        let incomingOrdersCount = 0;
        if (shopId) {
            incomingOrdersCount = await models.orders.count({
                where: {
                    shop_id: shopId,
                    status: { [Op.notIn]: ['completed', 'cancelled', 'cancelled_dismissed', 'disbursement_requested', 'disbursed'] }
                }
            });
        }

        const myOrdersCount = await models.orders.count({
            where: {
                user_id,
                status: { [Op.notIn]: ['completed', 'cancelled', 'cancelled_dismissed', 'disbursement_requested', 'disbursed'] }
            }
        });

        const communityCount = await models.notifications.count({
            where: {
                user_id,
                type: 'community',
                is_read: false
            }
        });

        const chatCount = await models.chats.count({
            distinct: true,
            col: 'id',
            include: [{
                model: models.chat_messages,
                as: 'messages',
                where: {
                    sender_id: { [Op.ne]: user_id },
                    is_read: false
                }
            }],
            where: {
                [Op.or]: [{ buyer_id: user_id }, { seller_id: user_id }]
            }
        });

        const systemNotifCount = await models.notifications.count({
            where: {
                user_id,
                type: { [Op.ne]: 'community' },
                is_read: false
            }
        });

        res.status(200).json({
            message: "Success fetching notification counts",
            data: {
                incoming_orders: incomingOrdersCount,
                my_orders: myOrdersCount,
                community: communityCount,
                chats: chatCount,
                system: systemNotifCount
            }
        });
    } catch (err) {
        console.error("Error getting notification counts:", err);
        next(err);
    }
};

module.exports.markCommunityAsRead = async (req, res, next) => {
    try {
        const { user_id } = req.params;

        // 1. Mark community notifications in notifications table as read
        await models.notifications.update(
            { is_read: true },
            { where: { user_id, type: 'community', is_read: false } }
        );

        // 2. Mark community comments as read
        const userTopics = await models.topics.findAll({
            where: { user_id, category: { [Op.ne]: 'Chat' } },
            attributes: ['id']
        });
        const topicIds = userTopics.map(t => t.id);
        if (topicIds.length > 0) {
            await models.comments.update(
                { is_read: true },
                { where: { topic_id: { [Op.in]: topicIds }, user_id: { [Op.ne]: user_id } } }
            );
        }
        res.status(200).json({ message: "Notifications marked as read" });
    } catch (err) {
        console.error("Error marking as read:", err);
        next(err);
    }
};

module.exports.markAllAsRead = async (req, res, next) => {
    try {
        const { user_id } = req.params;

        // 1. Mark system notifications as read
        await models.notifications.update(
            { is_read: true },
            { where: { user_id, is_read: false } }
        );

        // 2. Mark community comments as read
        const userTopics = await models.topics.findAll({
            where: { user_id, category: { [Op.ne]: 'Chat' } },
            attributes: ['id']
        });
        const topicIds = userTopics.map(t => t.id);
        if (topicIds.length > 0) {
            await models.comments.update(
                { is_read: true },
                { where: { topic_id: { [Op.in]: topicIds }, user_id: { [Op.ne]: user_id } } }
            );
        }

        res.status(200).json({ message: "All notifications marked as read" });
    } catch (err) {
        console.error("Error marking all as read:", err);
        next(err);
    }
};

module.exports.deleteAll = async (req, res, next) => {
    try {
        const { user_id } = req.params;

        // Physically delete system notifications for this user
        await models.notifications.destroy({
            where: { user_id }
        });

        res.status(200).json({ message: "All system notifications deleted" });
    } catch (err) {
        console.error("Error deleting all notifications:", err);
        next(err);
    }
};

module.exports.getNotificationsList = async (req, res, next) => {
    try {
        const { user_id } = req.params;
        const notifications = [];

        console.log(`Fetching notifications for user: ${user_id}`);

        // 1. Get Shop ID
        const shop = await models.shops.findOne({ where: { user_id } });
        const shopId = shop ? shop.id : null;

        // 2. Incoming Orders (Seller)
        if (shopId) {
            const incomingOrders = await models.orders.findAll({
                where: { shop_id: shopId, status: { [Op.notIn]: ['completed', 'cancelled', 'cancelled_dismissed', 'disbursement_requested', 'disbursed'] } },
                include: [
                    { model: models.listings, as: 'product', attributes: ['name'] },
                    { model: models.users, as: 'user', attributes: ['name', 'username'] }
                ],
                limit: 5,
                order: [[Sequelize.literal('COALESCE("orders"."updated_at", "orders"."created_at")'), 'DESC']]
            });
            console.log(`Found ${incomingOrders.length} incoming orders`);
            incomingOrders.forEach(order => {
                const buyerName = order.user?.name || order.user?.username || 'Pembeli';
                notifications.push({
                    id: `order_in_${order.id}`,
                    type: 'order_seller',
                    title: 'Pesanan Masuk',
                    message: `${buyerName} memesan "${order.product?.name || 'produk Anda'}" — ${ORDER_STATUS_LABELS[order.status] || order.status}`,
                    link: '/user/toko/pesanan-masuk',
                    time: order.updated_at || order.created_at,
                    is_read: false // Orders in progress are treated as "new/active"
                });
            });
        }

        // 3. My Orders (Buyer)
        const myOrders = await models.orders.findAll({
            where: { user_id, status: { [Op.notIn]: ['completed', 'cancelled', 'cancelled_dismissed', 'disbursement_requested', 'disbursed'] } },
            include: [
                { model: models.listings, as: 'product', attributes: ['name'] },
                { model: models.shops, as: 'shop', attributes: ['name'] }
            ],
            limit: 5,
            order: [[Sequelize.literal('COALESCE("orders"."updated_at", "orders"."created_at")'), 'DESC']]
        });
        console.log(`Found ${myOrders.length} my orders`);
        myOrders.forEach(order => {
            notifications.push({
                id: `order_out_${order.id}`,
                type: 'order_buyer',
                title: 'Update Pesanan',
                message: `Pesanan "${order.product?.name || 'Produk'}" dari ${order.shop?.name || 'Toko'} — ${ORDER_STATUS_LABELS[order.status] || order.status}`,
                link: '/user/pesanan',
                time: order.updated_at || order.created_at,
                is_read: false
            });
        });



        // 5. Product Chats (New Separate Table)
        const chatList = await models.chats.findAll({
            where: {
                [Op.or]: [{ buyer_id: user_id }, { seller_id: user_id }]
            },
            include: [
                { model: models.users, as: 'buyer', attributes: ['name', 'username'] },
                { model: models.users, as: 'seller', attributes: ['name', 'username'] },
                { model: models.listings, as: 'product', attributes: ['name'] },
                {
                    model: models.chat_messages,
                    as: 'messages',
                    where: {
                        sender_id: { [Op.ne]: user_id },
                        is_read: false
                    },
                    required: false
                }
            ],
            limit: 5,
            order: [[Sequelize.literal('COALESCE("chats"."updated_at", "chats"."created_at")'), 'DESC']]
        });
        console.log(`Found ${chatList.length} chats`);
        chatList.forEach(chat => {
            const isSeller = chat.seller_id === user_id;
            const partner = isSeller ? chat.buyer : chat.seller;
            const senderName = partner?.name || partner?.username || 'Seseorang';
            const hasUnread = chat.messages && chat.messages.length > 0;

            notifications.push({
                id: `chat_${chat.id}`,
                type: 'chat',
                title: isSeller ? 'Pesan dari Pembeli' : 'Chat Produk',
                message: `Pesan dari ${senderName} tentang "${chat.product?.name || 'Produk'}"`,
                link: 'chat_modal',
                data: {
                    topicId: chat.id,
                    sellerId: chat.seller_id,
                    buyerId: chat.buyer_id,
                    buyerName: chat.buyer?.name || chat.buyer?.username,
                    productId: chat.listing_id
                },
                time: chat.updated_at || chat.created_at,
                is_read: !hasUnread
            });
        });

        // 6. System Notifications (Moderation, etc.)
        const systemNotifs = await models.notifications.findAll({
            where: { user_id },
            limit: 10,
            order: [['created_at', 'DESC']]
        });
        console.log(`Found ${systemNotifs.length} system notifications`);
        systemNotifs.forEach(notif => {
            notifications.push({
                id: `sys_${notif.id}`,
                type: notif.type,
                title: notif.title,
                message: notif.message,
                link: notif.type === 'moderation_product' ? '/user/toko/daftar-produk' : (notif.type === 'moderation_shop' ? '/user/toko' : notif.link),
                time: notif.created_at,
                is_read: notif.is_read
            });
        });

        // Sort all by time
        notifications.sort((a, b) => new Date(b.time) - new Date(a.time));

        console.log(`Returning ${notifications.length} notifications in total`);
        res.status(200).json({ message: "Success", data: notifications.slice(0, 15) });
    } catch (err) {
        console.error("Error fetching notifications list:", err);
        next(err);
    }
};
