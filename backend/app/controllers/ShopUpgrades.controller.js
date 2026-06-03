const { Sequelize } = require("sequelize");
const initModels = require("../database/init");
const sequelize = new Sequelize(process.env.DATABASE_URL);
var models = initModels(sequelize);

module.exports.createUpgradeRequest = async (req, res, next) => {
  try {
    const user_id = req.user_data.id;
    const { plan_id, plan_name, price, account_name, bank_origin, payment_proof, unique_code } = req.body;

    // Find the user's shop
    const shop = await models.shops.findOne({ where: { user_id } });
    if (!shop) {
      return res.status(404).json({ message: "Toko tidak ditemukan. Silakan buka toko terlebih dahulu." });
    }

    // Check if there is already a pending upgrade request
    const existingPending = await models.shop_upgrades.findOne({
      where: {
        shop_id: shop.id,
        status: "pending_verification",
      },
    });

    if (existingPending) {
      return res.status(400).json({ message: "Anda sudah memiliki pengajuan upgrade yang sedang diproses." });
    }

    const upgrade = await models.shop_upgrades.create({
      shop_id: shop.id,
      plan_id,
      plan_name,
      price: parseInt(price),
      account_name,
      bank_origin,
      payment_proof,
      unique_code: parseInt(unique_code),
      status: "pending_verification",
    });

    const io = req.app.get("socketio");
    if (io) {
      io.to("admin_room").emit("new_upgrade_request", {
        id: upgrade.id,
        shop_name: shop.name,
        plan_name: upgrade.plan_name,
      });
    }

    res.status(201).json({
      message: "Pengajuan upgrade berhasil dikirim.",
      data: upgrade,
    });
  } catch (err) {
    console.error("Error creating upgrade request:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.getPendingUpgradeRequest = async (req, res, next) => {
  try {
    const user_id = req.user_data.id;

    const shop = await models.shops.findOne({ where: { user_id } });
    if (!shop) {
      return res.status(200).json({ data: null });
    }

    const pending = await models.shop_upgrades.findOne({
      where: {
        shop_id: shop.id,
        status: "pending_verification",
      },
    });

    res.status(200).json({
      message: "Pending request retrieved successfully",
      data: pending,
    });
  } catch (err) {
    console.error("Error getting pending request:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.getAllUpgradeRequests = async (req, res, next) => {
  try {
    const upgrades = await models.shop_upgrades.findAll({
      include: [
        {
          model: models.shops,
          as: "shop",
          include: [
            {
              model: models.users,
              as: "owner",
              attributes: ["name", "email", "phone"],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.status(200).json({
      message: "Success retrieving all upgrade requests",
      data: upgrades,
    });
  } catch (err) {
    console.error("Error getting all upgrade requests:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.updateUpgradeStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status tidak valid. Harus 'approved' atau 'rejected'." });
    }

    const upgrade = await models.shop_upgrades.findByPk(id, {
      include: [{ model: models.shops, as: "shop" }],
    });

    if (!upgrade) {
      return res.status(404).json({ message: "Pengajuan upgrade tidak ditemukan." });
    }

    if (upgrade.status !== "pending_verification") {
      return res.status(400).json({ message: "Pengajuan upgrade ini sudah diproses sebelumnya." });
    }

    // Start transaction/update
    if (status === "approved") {
      // Update upgrade request status
      await upgrade.update({
        status: "approved",
        updated_at: new Date(),
      });

      // Send notification to store owner
      try {
        const title = "Upgrade Toko Berhasil!";
        const message = `Selamat! Pengajuan upgrade toko Anda (${upgrade.plan_name}) telah disetujui. Pembayaran Anda telah terverifikasi oleh admin.`;

        const newNotif = await models.notifications.create({
          user_id: upgrade.shop.user_id,
          type: "moderation_shop",
          title,
          message,
          link: "/user/toko/upgrade-toko",
          created_at: new Date(),
        });

        // Emit socket event
        const io = req.app.get("socketio");
        if (io) {
          io.to(`user_${upgrade.shop.user_id}`).emit("new_notification", {
            id: newNotif.id,
            type: "moderation_shop",
            title,
            message,
            time: newNotif.created_at,
          });
          // Emit status update event
          io.to(`user_${upgrade.shop.user_id}`).emit("shop_upgrade_status_updated", {
            status: "approved",
            plan_name: upgrade.plan_name,
          });
        }
      } catch (notifErr) {
        console.error("Failed to create notifications for upgrade approval:", notifErr);
      }
    } else if (status === "rejected") {
      await upgrade.update({
        status: "rejected",
        rejection_reason: rejection_reason || "Bukti transfer tidak valid atau tidak cocok.",
        updated_at: new Date(),
      });

      // Send notification to store owner
      try {
        const title = "Upgrade Toko Ditolak";
        const message = `Maaf, pengajuan upgrade toko Anda (${upgrade.plan_name}) ditolak oleh admin. Alasan: ${rejection_reason || "Bukti transfer tidak valid."}`;

        const newNotif = await models.notifications.create({
          user_id: upgrade.shop.user_id,
          type: "moderation_shop",
          title,
          message,
          link: "/user/toko/upgrade-toko",
          created_at: new Date(),
        });

        // Emit socket event
        const io = req.app.get("socketio");
        if (io) {
          io.to(`user_${upgrade.shop.user_id}`).emit("new_notification", {
            id: newNotif.id,
            type: "moderation_shop",
            title,
            message,
            time: newNotif.created_at,
          });
          // Emit status update event
          io.to(`user_${upgrade.shop.user_id}`).emit("shop_upgrade_status_updated", {
            status: "rejected",
            plan_name: upgrade.plan_name,
          });
        }
      } catch (notifErr) {
        console.error("Failed to create notifications for upgrade rejection:", notifErr);
      }
    }

    res.status(200).json({
      message: `Pengajuan upgrade berhasil diubah menjadi ${status}.`,
      data: upgrade,
    });
  } catch (err) {
    console.error("Error updating upgrade status:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.cancelPendingUpgradeRequest = async (req, res, next) => {
  try {
    const user_id = req.user_data.id;
    const shop = await models.shops.findOne({ where: { user_id } });
    if (!shop) {
      return res.status(404).json({ message: "Toko tidak ditemukan." });
    }

    const pending = await models.shop_upgrades.findOne({
      where: {
        shop_id: shop.id,
        status: "pending_verification",
      },
    });

    if (!pending) {
      return res.status(404).json({ message: "Tidak ada pengajuan upgrade aktif." });
    }

    await pending.destroy();

    const io = req.app.get("socketio");
    if (io) {
      io.to("admin_room").emit("upgrade_request_cancelled", {
        shop_id: shop.id,
      });
    }

    res.status(200).json({
      message: "Pengajuan upgrade berhasil dibatalkan.",
    });
  } catch (err) {
    console.error("Error cancelling pending request:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.getAllPlans = async (req, res, next) => {
  try {
    const plans = await models.shop_upgrade_plans.findAll({
      order: [["price", "ASC"]],
    });
    res.status(200).json({
      message: "Success retrieving all upgrade plans",
      data: plans,
    });
  } catch (err) {
    console.error("Error getting all upgrade plans:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.createPlan = async (req, res, next) => {
  try {
    const { name, sub_name, price, duration, description, features, badge, badge_color, popular, gradient } = req.body;

    const plan = await models.shop_upgrade_plans.create({
      name,
      sub_name,
      price: parseInt(price) || 0,
      duration: duration || "/ 2 Bulan",
      description,
      features: Array.isArray(features) ? features : [],
      badge,
      badge_color,
      popular: !!popular,
      gradient,
    });

    const io = req.app.get("socketio");
    if (io) {
      io.emit("upgrade_plans_updated");
    }

    res.status(201).json({
      message: "Paket upgrade berhasil dibuat.",
      data: plan,
    });
  } catch (err) {
    console.error("Error creating plan:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.updatePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, sub_name, price, duration, description, features, badge, badge_color, popular, gradient } = req.body;

    const plan = await models.shop_upgrade_plans.findByPk(id);
    if (!plan) {
      return res.status(404).json({ message: "Paket upgrade tidak ditemukan." });
    }

    await plan.update({
      name,
      sub_name,
      price: price !== undefined ? parseInt(price) : plan.price,
      duration: duration !== undefined ? duration : plan.duration,
      description,
      features: Array.isArray(features) ? features : plan.features,
      badge,
      badge_color,
      popular: popular !== undefined ? !!popular : plan.popular,
      gradient,
      updated_at: new Date(),
    });

    const io = req.app.get("socketio");
    if (io) {
      io.emit("upgrade_plans_updated");
    }

    res.status(200).json({
      message: "Paket upgrade berhasil diperbarui.",
      data: plan,
    });
  } catch (err) {
    console.error("Error updating plan:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.deletePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const plan = await models.shop_upgrade_plans.findByPk(id);
    if (!plan) {
      return res.status(404).json({ message: "Paket upgrade tidak ditemukan." });
    }

    await plan.destroy();

    const io = req.app.get("socketio");
    if (io) {
      io.emit("upgrade_plans_updated");
    }

    res.status(200).json({
      message: "Paket upgrade berhasil dihapus.",
    });
  } catch (err) {
    console.error("Error deleting plan:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.deleteUpgradeRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const upgrade = await models.shop_upgrades.findByPk(id);
    if (!upgrade) {
      return res.status(404).json({ message: "Pengajuan upgrade tidak ditemukan." });
    }

    await upgrade.destroy();

    res.status(200).json({
      message: "Pengajuan upgrade berhasil dihapus.",
    });
  } catch (err) {
    console.error("Error deleting upgrade request:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
