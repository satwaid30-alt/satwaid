const { Sequelize, Op } = require("sequelize");
const initModels = require("../database/init");
const sequelize = new Sequelize(process.env.DATABASE_URL);
var models = initModels(sequelize);

const COMPLETED_ORDER_STATUSES = ["completed", "disbursement_requested", "disbursed"];

exports.getDashboardStats = async (req, res) => {
  try {
    console.log("Fetching admin stats...");

    // Execute queries independently to prevent one failure from blocking everything
    const [totalProducts, totalCommunities, totalShops, adminRevenue, adminRevenueCount] = await Promise.all([
      models.listings
        .count({
          where: { status: { [Op.notIn]: ["deleted", "Deleted"] } },
        })
        .catch((e) => {
          console.error("Error count listings:", e);
          return 0;
        }),
      models.topics.count().catch((e) => {
        console.error("Error count topics:", e);
        return 0;
      }),
      models.shops.count().catch((e) => {
        console.error("Error count shops:", e);
        return 0;
      }),
      models.orders
        .sum("admin_fee", {
          where: { status: { [Op.in]: COMPLETED_ORDER_STATUSES } },
        })
        .catch((e) => {
          console.error("Error sum admin fee:", e);
          return 0;
        }),
      models.orders
        .count({
          where: { status: { [Op.in]: COMPLETED_ORDER_STATUSES } },
        })
        .catch((e) => {
          console.error("Error count completed orders:", e);
          return 0;
        }),
    ]);

    const recentProducts = await models.listings
      .findAll({
        limit: 3,
        order: [["created_at", "DESC"]],
        include: [{ model: models.shops, as: "shop" }],
      })
      .catch((e) => {
        console.error("Error fetch recent products:", e);
        return [];
      });

    const recentShops = await models.shops
      .findAll({
        limit: 3,
        order: [["created_at", "DESC"]],
      })
      .catch((e) => {
        console.error("Error fetch recent shops:", e);
        return [];
      });

    const recentOrders = await models.orders
      .findAll({
        limit: 3,
        order: [["updated_at", "DESC"]],
        where: { status: "waiting_payment" },
      })
      .catch((e) => {
        console.error("Error fetch recent orders:", e);
        return [];
      });

    // Pendapatan Tiap Toko
    console.log("Fetching shop earnings...");
    let shopEarnings = [];
    try {
      shopEarnings = await models.shops.findAll({
        attributes: [
          "id",
          "name",
          "logo_url",
          [
            sequelize.literal(`(
                            SELECT COALESCE(SUM("orders"."total_price" - "orders"."admin_fee"), 0)
                            FROM "orders"
                            WHERE "orders"."shop_id" = "shops"."id"
                            AND "orders"."status" IN ('completed', 'disbursement_requested', 'disbursed')
                        )`),
            "totalEarnings",
          ],
        ],
        where: sequelize.literal(`(
                    SELECT COALESCE(SUM("orders"."total_price" - "orders"."admin_fee"), 0)
                    FROM "orders"
                    WHERE "orders"."shop_id" = "shops"."id"
                    AND "orders"."status" IN ('completed', 'disbursement_requested', 'disbursed')
                ) > 0`),
        order: [
          [
            sequelize.literal(`(
                    SELECT COALESCE(SUM("orders"."total_price" - "orders"."admin_fee"), 0)
                    FROM "orders"
                    WHERE "orders"."shop_id" = "shops"."id"
                    AND "orders"."status" IN ('completed', 'disbursement_requested', 'disbursed')
                )`),
            "DESC",
          ],
        ],
        limit: 5,
      });
      shopEarnings = shopEarnings.map((s) => ({
        ...s.toJSON(),
        totalEarnings: Number(s.get("totalEarnings") || 0),
      }));
    } catch (e) {
      console.error("Error fetch shop earnings query:", e);
    }

    const completedOrders = await models.orders
      .findAll({
        limit: 10,
        order: [["updated_at", "DESC"]],
        where: { status: { [Op.in]: COMPLETED_ORDER_STATUSES } },
        include: [{ model: models.shops, as: "shop", attributes: ["name"] }],
      })
      .catch((e) => {
        console.error("Error fetch completed orders:", e);
        return [];
      });

    console.log("Stats fetched successfully");
    res.json({
      success: true,
      stats: {
        totalProducts,
        totalCommunities,
        totalShops,
        adminRevenue: Number(adminRevenue || 0),
        adminRevenueCount: Number(adminRevenueCount || 0),
      },
      recentActivity: {
        products: recentProducts,
        shops: recentShops,
        orders: recentOrders,
      },
      shopEarnings,
      completedOrders,
    });
  } catch (error) {
    console.error("Critical error in getDashboardStats:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const fs = require("fs");
const path = require("path");
const SETTINGS_FILE_PATH = path.join(__dirname, "../config/settings.json");

const getAdminFeeValue = () => {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const data = JSON.parse(fs.readFileSync(SETTINGS_FILE_PATH, "utf8"));
      if (data && data.admin_fee !== undefined) {
        return Number(data.admin_fee);
      }
    }
  } catch (error) {
    console.error("Error reading admin fee from file:", error);
  }
  return 5000;
};

const saveAdminFeeValue = (fee) => {
  try {
    const data = { admin_fee: Number(fee) };
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Error saving admin fee to file:", error);
    return false;
  }
};

exports.getAdminFeeValueHelper = getAdminFeeValue;

exports.getAdminFee = async (req, res) => {
  try {
    let adminFee;
    const adminFeeSetting = await models.settings.findOne({ where: { key: "admin_fee" } });
    if (adminFeeSetting) {
      adminFee = Number(adminFeeSetting.value);
    } else {
      adminFee = getAdminFeeValue();
      await models.settings.create({
        key: "admin_fee",
        value: String(adminFee)
      }).catch(err => console.error("Error initializing settings in DB:", err));
    }
    
    global.adminFeeCache = adminFee;

    return res.json({
      success: true,
      adminFee,
    });
  } catch (error) {
    console.error("Error in getAdminFee controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: " + error.message,
    });
  }
};

exports.updateAdminFee = async (req, res) => {
  try {
    const { adminFee } = req.body;
    if (adminFee === undefined || isNaN(Number(adminFee)) || Number(adminFee) < 0) {
      return res.status(400).json({
        success: false,
        message: "Biaya admin tidak valid",
      });
    }

    // Update or create in the database
    const [setting, created] = await models.settings.findOrCreate({
      where: { key: "admin_fee" },
      defaults: { value: String(adminFee) }
    });

    if (!created) {
      await setting.update({ value: String(adminFee) });
    }

    // Sync in-memory cache and fallback JSON file
    global.adminFeeCache = Number(adminFee);
    saveAdminFeeValue(adminFee);

    // Emit real-time update socket event
    const io = req.app.get('socketio');
    if (io) {
      io.emit('admin_fee_updated', { adminFee: Number(adminFee) });
      console.log(`[Socket] Broadcast admin_fee_updated: Rp ${adminFee}`);
    }

    return res.json({
      success: true,
      message: "Biaya admin berhasil diperbarui",
      adminFee: Number(adminFee),
    });
  } catch (error) {
    console.error("Error in updateAdminFee controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: " + error.message,
    });
  }
};
