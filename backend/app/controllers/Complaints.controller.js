const { Sequelize } = require("sequelize");
const initModels = require("../database/init");
const sequelize = new Sequelize(process.env.DATABASE_URL);
var models = initModels(sequelize);

// User creates a complaint
module.exports.createComplaint = async (req, res) => {
  try {
    const user_id = req.user_data.id;
    const { category, title, description, attachment_url } = req.body;

    if (!category || !title || !description) {
      return res.status(400).json({ message: "Kategori, Judul, dan Deskripsi pengaduan wajib diisi." });
    }

    const complaint = await models.complaints.create({
      user_id,
      category,
      title,
      description,
      attachment_url: attachment_url || null,
      status: "pending",
      created_at: new Date()
    });

    // Send real-time event to Admin Room
    const io = req.app.get("socketio");
    if (io) {
      io.to("admin_room").emit("new_complaint", {
        id: complaint.id,
        category: complaint.category,
        title: complaint.title,
        created_at: complaint.created_at
      });
    }

    res.status(201).json({
      message: "Pengaduan Anda berhasil dikirim dan akan segera diproses oleh admin.",
      data: complaint
    });
  } catch (err) {
    console.error("Error creating complaint:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// User gets their own complaints
module.exports.getUserComplaints = async (req, res) => {
  try {
    const user_id = req.user_data.id;

    const complaints = await models.complaints.findAll({
      where: { user_id },
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
      order: [["created_at", "DESC"]]
    });

    res.status(200).json({
      message: "Berhasil mengambil riwayat pengaduan Anda.",
      data: complaints
    });
  } catch (err) {
    console.error("Error getting user complaints:", err);
    res.status(500).json({ message: "Internal server error: " + err.message });
  }
};

// Admin gets all complaints with optional status/category filters
module.exports.getAllComplaints = async (req, res) => {
  try {
    const { status, category } = req.query;
    const whereClause = {};

    if (status) {
      whereClause.status = status;
    }
    if (category) {
      whereClause.category = category;
    }

    const complaints = await models.complaints.findAll({
      where: whereClause,
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
      include: [
        {
          model: models.users,
          as: "user",
          attributes: ["id", "name", "username", "email", "phone", "avatar_url"]
        }
      ],
      order: [["created_at", "DESC"]]
    });

    res.status(200).json({
      message: "Berhasil mengambil seluruh data pengaduan.",
      data: complaints
    });
  } catch (err) {
    console.error("Error getting all complaints:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Admin responds to and/or updates complaint status
module.exports.respondToComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_response } = req.body;

    if (status && !["pending", "processing", "resolved"].includes(status)) {
      return res.status(400).json({ message: "Status tidak valid. Harus 'pending', 'processing', atau 'resolved'." });
    }

    const complaint = await models.complaints.findByPk(id, {
      include: [
        {
          model: models.users,
          as: "user",
          attributes: ["id", "name", "username"]
        }
      ]
    });

    if (!complaint) {
      return res.status(404).json({ message: "Pengaduan tidak ditemukan." });
    }

    const updateFields = {
      updated_at: new Date()
    };

    if (status) {
      updateFields.status = status;
    }
    if (admin_response !== undefined) {
      updateFields.admin_response = admin_response;
    }

    await complaint.update(updateFields);

    // Create a notification in the DB for the user
    let titleNotif = "Pembaruan Status Pengaduan";
    let messageNotif = `Pengaduan Anda: "${complaint.title}" sedang diproses oleh admin.`;
    
    if (updateFields.status === "resolved") {
      titleNotif = "Pengaduan Anda Telah Selesai";
      messageNotif = `Pengaduan Anda: "${complaint.title}" telah diselesaikan. Tanggapan Admin: ${admin_response || "-"}`;
    } else if (admin_response) {
      titleNotif = "Admin Merespon Pengaduan Anda";
      messageNotif = `Pengaduan Anda: "${complaint.title}" mendapatkan tanggapan dari admin: ${admin_response}`;
    }

    const notification = await models.notifications.create({
      user_id: complaint.user_id,
      type: "complaint",
      title: titleNotif,
      message: messageNotif,
      link: "/user/pengaduan",
      created_at: new Date()
    });

    // Send real-time events via socket.io
    const io = req.app.get("socketio");
    if (io) {
      // Notify the specific user about the new notification
      io.to(`user_${complaint.user_id}`).emit("new_notification", {
        id: notification.id,
        type: "complaint",
        title: titleNotif,
        message: messageNotif,
        link: "/user/pengaduan",
        time: notification.created_at
      });

      // Emit status/reply updates to user to auto-refresh their page
      io.to(`user_${complaint.user_id}`).emit("complaint_updated", {
        id: complaint.id,
        status: complaint.status,
        admin_response: complaint.admin_response
      });

      // Also let other admins know that this complaint is handled
      io.to("admin_room").emit("complaint_status_changed", {
        id: complaint.id,
        status: complaint.status
      });
    }

    res.status(200).json({
      message: "Berhasil memberikan tanggapan/memperbarui status pengaduan.",
      data: complaint
    });
  } catch (err) {
    console.error("Error updating complaint status:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all comments for a complaint
module.exports.getComplaintComments = async (req, res) => {
  try {
    const { complaint_id } = req.params;
    const user_id = req.user_data.id;
    const user_role = req.user_data.role;

    const complaint = await models.complaints.findByPk(complaint_id);
    if (!complaint) {
      return res.status(404).json({ message: "Pengaduan tidak ditemukan." });
    }

    // Authorization: User must be complaint owner OR an admin
    if (user_role !== "admin" && complaint.user_id !== user_id) {
      return res.status(403).json({ message: "Anda tidak memiliki akses ke pengaduan ini." });
    }

    const comments = await models.complaint_comments.findAll({
      where: { complaint_id },
      include: [
        {
          model: models.users,
          as: "author",
          attributes: ["id", "name", "username", "avatar_url", "role"]
        }
      ],
      order: [["created_at", "ASC"]]
    });

    res.status(200).json({
      message: "Berhasil mengambil komentar pengaduan.",
      data: comments
    });
  } catch (err) {
    console.error("Error getting complaint comments:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

