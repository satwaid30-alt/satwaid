const { Sequelize } = require('sequelize');
const initModels = require('../database/init');
const sequelize = new Sequelize(process.env.DATABASE_URL);
var models = initModels(sequelize);

/**
 * Generate a unique shop code in the format TK-XXXXXXXX
 */
async function generateShopCode() {
    const prefix = 'TK';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code, isUnique = false;
    while (!isUnique) {
        let random = '';
        for (let i = 0; i < 8; i++) {
            random += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        code = `${prefix}-${random}`;
        const existing = await models.shops.findOne({ where: { shop_code: code } });
        if (!existing) isUnique = true;
    }
    return code;
}

module.exports.getAllShops = async (req, res, next) => {
    try {
        const shops = await models.shops.findAll({
            include: [
                {
                    model: models.users,
                    as: 'owner',
                    attributes: ['name', 'email', 'bank_accounts', 'phone', 'address', 'city', 'province']
                },
                {
                    model: models.listings,
                    as: 'listings',
                    attributes: ['id']
                }
            ]
        });

        res.status(200).json({
            message: "Success retrieving all shops",
            data: shops
        });
    } catch (err) {
        console.error("Error getting all shops:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports.getShopById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const shop = await models.shops.findByPk(id, {
            include: [
                {
                    model: models.users,
                    as: 'owner',
                    attributes: ['name', 'email', 'bank_accounts', 'phone', 'address', 'city', 'province']
                },
                {
                    model: models.listings,
                    as: 'listings',
                    attributes: ['id']
                }
            ]
        });

        if (!shop) {
            return res.status(404).json({ message: "Shop not found" });
        }

        // Calculate average rating and total sales dynamically
        const statsData = await models.orders.findAll({
            where: { 
                shop_id: shop.id,
                status: { [Sequelize.Op.in]: ['completed', 'disbursement_requested', 'disbursed'] }
            },
            attributes: [
                [Sequelize.fn('AVG', Sequelize.col('rating')), 'avgRating'],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalSales'],
                [Sequelize.fn('COUNT', Sequelize.col('rating')), 'totalRatings'],
                [Sequelize.fn('COUNT', Sequelize.col('review')), 'totalReviews']
            ],
            raw: true
        });

        const shopData = shop.toJSON();
        shopData.avgRating = statsData[0]?.avgRating ? parseFloat(statsData[0].avgRating).toFixed(1) : "0.0";
        shopData.totalSales = parseInt(statsData[0]?.totalSales || 0);
        shopData.totalRatings = parseInt(statsData[0]?.totalRatings || 0);
        shopData.totalReviews = parseInt(statsData[0]?.totalReviews || 0);

        res.status(200).json({
            message: "Success retrieving shop detail",
            data: shopData
        });
    } catch (err) {
        console.error("Error getting shop by id:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports.getShopByUserId = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const shop = await models.shops.findOne({
            where: { user_id: userId },
            include: [
                {
                    model: models.users,
                    as: 'owner',
                    attributes: ['bank_accounts', 'name', 'avatar_url', 'phone']
                }
            ]
        });

        if (!shop) {
            return res.status(404).json({ message: "Shop not found", data: null });
        }

        // Calculate average rating and total sales dynamically
        const statsData = await models.orders.findAll({
            where: { 
                shop_id: shop.id,
                status: { [Sequelize.Op.in]: ['completed', 'disbursement_requested', 'disbursed'] }
            },
            attributes: [
                [Sequelize.fn('AVG', Sequelize.col('rating')), 'avgRating'],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalSales'],
                [Sequelize.fn('COUNT', Sequelize.col('rating')), 'totalRatings'],
                [Sequelize.fn('COUNT', Sequelize.col('review')), 'totalReviews']
            ],
            raw: true
        });

        const shopData = shop.toJSON();
        shopData.avgRating = statsData[0]?.avgRating ? parseFloat(statsData[0].avgRating).toFixed(1) : "0.0";
        shopData.totalSales = parseInt(statsData[0]?.totalSales || 0);
        shopData.totalRatings = parseInt(statsData[0]?.totalRatings || 0);
        shopData.totalReviews = parseInt(statsData[0]?.totalReviews || 0);

        res.status(200).json({
            message: "Success retrieving shop",
            data: shopData
        });
    } catch (err) {
        console.error("Error getting shop by user id:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports.createShop = async (req, res, next) => {
    try {
        const { user_id, name, description, address, city, province, whatsapp, logo_url, banner_url, nik, shipping_policy, warranty_policy } = req.body;

        // Check if user already has a shop
        const existingShop = await models.shops.findOne({ where: { user_id } });
        if (existingShop) {
            return res.status(400).json({ message: "User already has a shop" });
        }

        // Auto-generate unique shop code
        const shop_code = await generateShopCode();

        const shop = await models.shops.create({
            user_id,
            shop_code,
            name,
            description,
            address,
            city,
            province,
            whatsapp,
            logo_url,
            banner_url,
            nik,
            shipping_policy,
            warranty_policy
        });

        res.status(201).json({
            message: "Shop created successfully",
            data: shop
        });
    } catch (err) {
        console.error("Error creating shop:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports.updateShop = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, address, city, province, whatsapp, logo_url, banner_url, nik, status, rejection_reason, shipping_policy, warranty_policy } = req.body;

        const shop = await models.shops.findByPk(id);
        if (!shop) {
            return res.status(404).json({ message: "Shop not found" });
        }

        await shop.update({
            name,
            description,
            address,
            city,
            province,
            whatsapp,
            logo_url,
            banner_url,
            nik,
            status,
            rejection_reason,
            shipping_policy,
            warranty_policy,
            updated_at: new Date()
        });

        // Cascade status update to the user if status is provided
        if (status) {
            await models.users.update(
                { status: status },
                { where: { id: shop.user_id } }
            );

            // Create Moderation Notification
            try {
                const title = status === 'active' ? 'Toko Diverifikasi' : (status === 'suspended' ? 'Toko Ditangguhkan' : 'Update Status Toko');
                const message = status === 'active' 
                    ? `Selamat! Toko "${shop.name}" Anda telah diverifikasi oleh admin. Sekarang Anda bisa mulai berjualan!`
                    : (status === 'suspended' 
                        ? `Toko "${shop.name}" Anda telah ditangguhkan oleh admin. Silakan hubungi dukungan untuk informasi lebih lanjut.`
                        : `Status Toko "${shop.name}" telah diubah menjadi ${status.toUpperCase()}.`);
                
                // 1. Create Notification in DB
                const newNotif = await models.notifications.create({
                    user_id: shop.user_id,
                    type: 'moderation_shop',
                    title,
                    message,
                    link: '/user/toko',
                    created_at: new Date()
                });

                // 2. Emit Socket Event
                const io = req.app.get('socketio');
                if (io) {
                    io.to(`user_${shop.user_id}`).emit('new_notification', {
                        id: newNotif.id,
                        type: 'moderation_shop',
                        title,
                        message,
                        time: newNotif.created_at
                    });
                }
            } catch (notifErr) {
                console.error("Failed to create shop moderation notification:", notifErr);
            }
        }

        res.status(200).json({
            message: "Shop updated successfully",
            data: shop
        });
    } catch (err) {
        console.error("Error updating shop:", err);
        res.status(500).json({ 
            message: "Internal server error",
            error: err.message 
        });
    }
};

module.exports.deleteShop = async (req, res, next) => {
    try {
        const { id } = req.params;
        const shop = await models.shops.findByPk(id);
        if (!shop) {
            return res.status(404).json({ message: "Shop not found" });
        }

        // 1. Delete all listings associated with this shop
        await models.listings.destroy({ where: { shop_id: id } });

        const userId = shop.user_id;

        // 2. Delete the shop
        await shop.destroy();

        // 3. Reset user status to 'active' in case it was 'suspended'
        await models.users.update(
            { status: 'active' },
            { where: { id: userId } }
        );

        res.status(200).json({
            message: "Toko dan semua iklannya berhasil dihapus, status user telah disinkronkan"
        });
    } catch (err) {
        console.error("Error deleting shop:", err);
        res.status(500).json({ 
            message: "Internal server error",
            error: err.message 
        });
    }
};
