const { Sequelize } = require('sequelize');
const initModels = require('../database/init');
const sequelize = new Sequelize(process.env.DATABASE_URL);
var models = initModels(sequelize);

module.exports.getAdvertisements = async (req, res, next) => {
    try {
        const ads = await models.advertisements.findAll({
            order: [['created_at', 'DESC']]
        });
        res.status(200).json({
            message: "Success",
            data: ads
        });
    } catch (err) {
        console.error("Error getting advertisements:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports.createAdvertisement = async (req, res, next) => {
    try {
        const { placement, category, title, badge, button_text, description, image_url, mobile_image_url, link_url, status } = req.body;
        const ad = await models.advertisements.create({
            placement,
            category,
            title,
            badge,
            button_text,
            description,
            image_url,
            mobile_image_url,
            link_url,
            status: status || 'Aktif'
        });

        // Emit socket event
        const io = req.app.get('socketio');
        if (io) {
            io.emit('new_advertisement_published', ad);
        }

        res.status(201).json({
            message: "Advertisement created successfully",
            data: ad
        });
    } catch (err) {
        console.error("Error creating advertisement:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports.updateAdvertisement = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { placement, category, title, badge, button_text, description, image_url, mobile_image_url, link_url, status } = req.body;
        const ad = await models.advertisements.findByPk(id);
        if (!ad) {
            return res.status(404).json({ message: "Advertisement not found" });
        }
        await ad.update({
            placement,
            category,
            title,
            badge,
            button_text,
            description,
            image_url,
            mobile_image_url,
            link_url,
            status,
            updated_at: new Date()
        });

        // Emit socket event
        const io = req.app.get('socketio');
        if (io) {
            io.emit('advertisement_updated', ad);
        }

        res.status(200).json({
            message: "Advertisement updated successfully",
            data: ad
        });
    } catch (err) {
        console.error("Error updating advertisement:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports.deleteAdvertisement = async (req, res, next) => {
    try {
        const { id } = req.params;
        const ad = await models.advertisements.findByPk(id);
        if (!ad) {
            return res.status(404).json({ message: "Advertisement not found" });
        }
        await ad.destroy();

        // Emit socket event
        const io = req.app.get('socketio');
        if (io) {
            io.emit('advertisement_deleted', { id });
        }

        res.status(200).json({
            message: "Advertisement deleted successfully"
        });
    } catch (err) {
        console.error("Error deleting advertisement:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
