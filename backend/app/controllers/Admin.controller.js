const { Sequelize } = require('sequelize');
const initModels = require('../database/init');
const sequelize = new Sequelize(process.env.DATABASE_URL);
var models = initModels(sequelize);

exports.getDashboardStats = async (req, res) => {
    try {
        console.log("Fetching admin stats...");
        
        // Execute queries independently to prevent one failure from blocking everything
        const [totalProducts, totalCommunities, totalShops, adminRevenue] = await Promise.all([
            models.listings.count().catch(e => { console.error("Error count listings:", e); return 0; }),
            models.topics.count().catch(e => { console.error("Error count topics:", e); return 0; }),
            models.shops.count().catch(e => { console.error("Error count shops:", e); return 0; }),
            models.orders.sum('admin_fee', { where: { status: 'completed' } }).catch(e => { console.error("Error sum admin fee:", e); return 0; })
        ]);

        const recentProducts = await models.listings.findAll({
            limit: 3,
            order: [['created_at', 'DESC']],
            include: [{ model: models.shops, as: 'shop' }]
        }).catch(e => { console.error("Error fetch recent products:", e); return []; });

        const recentShops = await models.shops.findAll({
            limit: 3,
            order: [['created_at', 'DESC']]
        }).catch(e => { console.error("Error fetch recent shops:", e); return []; });

        const recentOrders = await models.orders.findAll({
            limit: 3,
            order: [['updated_at', 'DESC']],
            where: { status: 'waiting_payment' }
        }).catch(e => { console.error("Error fetch recent orders:", e); return []; });

        // Pendapatan Tiap Toko
        console.log("Fetching shop earnings...");
        let shopEarnings = [];
        try {
            shopEarnings = await models.shops.findAll({
                attributes: [
                    'id', 
                    'name', 
                    'logo_url',
                    [
                        sequelize.literal(`(
                            SELECT COALESCE(SUM(total_price), 0)
                            FROM "orders"
                            WHERE "orders".shop_id = "shops".id
                            AND "orders".status = 'completed'
                        )`),
                        'totalEarnings'
                    ]
                ],
                order: [[sequelize.literal(`(
                            SELECT COALESCE(SUM(total_price), 0)
                            FROM "orders"
                            WHERE "orders".shop_id = "shops".id
                            AND "orders".status = 'completed'
                        )`), 'DESC']],
                limit: 5
            });
            shopEarnings = shopEarnings.map(s => ({
                ...s.toJSON(),
                totalEarnings: parseFloat(s.get('totalEarnings') || 0)
            }));
        } catch (e) {
            console.error("Error fetch shop earnings query:", e);
        }

        console.log("Stats fetched successfully");
        res.json({
            success: true,
            stats: {
                totalProducts,
                totalCommunities,
                totalShops,
                adminRevenue: adminRevenue || 0
            },
            recentActivity: {
                products: recentProducts,
                shops: recentShops,
                orders: recentOrders
            },
            shopEarnings
        });
    } catch (error) {
        console.error("Critical error in getDashboardStats:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};
