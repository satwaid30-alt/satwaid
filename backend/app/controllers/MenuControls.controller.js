const { Sequelize } = require('sequelize');
const initModels = require('../database/init');
const sequelize = new Sequelize(process.env.DATABASE_URL);
const models = initModels(sequelize);

const DEFAULT_MENUS = [
  { menu_key: "beranda", name: "Beranda Website", parent_key: null, status: "active", message: "" },
  { menu_key: "profil", name: "Pengaturan Profil", parent_key: null, status: "active", message: "" },
  { menu_key: "komunitas", name: "Komunitas Saya", parent_key: null, status: "active", message: "" },
  { menu_key: "pesanan", name: "Pesanan Saya", parent_key: null, status: "active", message: "" },
  { menu_key: "pesanan_aktif", name: "Pesanan Aktif", parent_key: "pesanan", status: "active", message: "" },
  { menu_key: "lelang_aktif", name: "Lelang Aktif", parent_key: "pesanan", status: "active", message: "" },
  { menu_key: "riwayat_pesanan", name: "Riwayat Pesanan", parent_key: "pesanan", status: "active", message: "" },
  { menu_key: "toko", name: "Dashboard Seller", parent_key: null, status: "active", message: "" },
  { menu_key: "toko_dashboard", name: "Dashboard Utama", parent_key: "toko", status: "active", message: "" },
  { menu_key: "toko_profil", name: "Profil Toko", parent_key: "toko", status: "active", message: "" },
  { menu_key: "toko_jual", name: "Jual Langsung", parent_key: "toko", status: "active", message: "" },
  { menu_key: "toko_lelang", name: "Lelang Produk", parent_key: "toko", status: "active", message: "" },
  { menu_key: "toko_produk", name: "Daftar Produk", parent_key: "toko", status: "active", message: "" },
  { menu_key: "toko_pesanan", name: "Pesanan Masuk", parent_key: "toko", status: "active", message: "" },
  { menu_key: "toko_keuangan", name: "Pengajuan Keuangan", parent_key: "toko", status: "active", message: "" },
  { menu_key: "keamanan", name: "Keamanan Akun", parent_key: null, status: "active", message: "" }
];

exports.getMenuControls = async (req, res) => {
    try {
        let menus = await models.menu_controls.findAll({
            order: [
                // Order customly or alphabetically
                [sequelize.literal(`CASE WHEN parent_key IS NULL THEN 0 ELSE 1 END`), 'ASC'],
                ['menu_key', 'ASC']
            ]
        });
        
        if (menus.length === 0) {
            // Seed default menus
            await models.menu_controls.bulkCreate(DEFAULT_MENUS);
            menus = await models.menu_controls.findAll({
                order: [
                    [sequelize.literal(`CASE WHEN parent_key IS NULL THEN 0 ELSE 1 END`), 'ASC'],
                    ['menu_key', 'ASC']
                ]
            });
        }
        
        res.json({
            success: true,
            data: menus
        });
    } catch (error) {
        console.error("Error fetching menu controls:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

exports.updateMenuControl = async (req, res) => {
    const { menu_key } = req.params;
    const { status, message } = req.body;
    
    try {
        const menu = await models.menu_controls.findOne({ where: { menu_key } });
        if (!menu) {
            return res.status(404).json({
                success: false,
                message: "Menu control item not found"
            });
        }
        
        menu.status = status || menu.status;
        menu.message = message !== undefined ? message : menu.message;
        menu.updated_at = new Date();
        await menu.save();
        
        const io = req.app.get('socketio');
        if (io) {
            io.emit('menu_controls_updated');
        }
        
        res.json({
            success: true,
            message: "Menu control updated successfully",
            data: menu
        });
    } catch (error) {
        console.error("Error updating menu control:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

exports.bulkUpdateMenuControls = async (req, res) => {
    const { updates } = req.body; // Array of { menu_key, status, message }
    
    try {
        if (!updates || !Array.isArray(updates)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payload format. Expected 'updates' array."
            });
        }
        
        for (const item of updates) {
            const { menu_key, status, message } = item;
            await models.menu_controls.update(
                { 
                    status, 
                    message,
                    updated_at: new Date()
                },
                { where: { menu_key } }
            );
        }
        
        const io = req.app.get('socketio');
        if (io) {
            io.emit('menu_controls_updated');
        }
        
        res.json({
            success: true,
            message: "Menu controls bulk updated successfully"
        });
    } catch (error) {
        console.error("Error bulk updating menu controls:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};
