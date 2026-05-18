const { Sequelize } = require('sequelize');
const initModels = require('../database/init');
const sequelize = new Sequelize(process.env.DATABASE_URL);
var models = initModels(sequelize);

module.exports.getUsers = async (req, res, next) => {
    try {
        const users = await models.users.findAll({
            attributes: ['id', 'name', 'username', 'email', 'role', 'created_at', 'phone', 'address', 'city', 'province', 'bank_accounts', 'avatar_url'],
            order: [['created_at', 'DESC']]
        });

        res.status(200).json({
            message: "Success retrieving users",
            data: users
        });
    } catch (err) {
        console.error("Error getting users:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports.getUserCount = async (req, res, next) => {
    try {
        const count = await models.users.count();
        res.status(200).json({
            message: "Success",
            data: count
        });
    } catch (err) {
        console.error("Error getting user count:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports.getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await models.users.findOne({
            where: { id },
            attributes: ['id', 'name', 'username', 'email', 'role', 'phone', 'address', 'city', 'province', 'bank_accounts', 'avatar_url']
        });


        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "Success",
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                name: user.name,
                role: user.role,
                phone: user.phone || "",
                address: user.address || "",
                city: user.city || "",
                province: user.province || "",
                bank_accounts: user.bank_accounts || [],
                avatar_url: user.avatar_url || ""
            }
        });
    } catch (err) {
        console.error("Error getting user by id:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports.updateProfile = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, phone, address, city, province, bankAccounts, avatar_url } = req.body;

        const user = await models.users.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await user.update({
            name,
            phone,
            address,
            city,
            province,
            bank_accounts: bankAccounts,
            avatar_url
        });

        res.status(200).json({
            message: "Profile updated successfully",
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                name: user.name,
                role: user.role,
                phone: user.phone || "",
                address: user.address || "",
                city: user.city || "",
                province: user.province || "",
                bank_accounts: user.bank_accounts || [],
                avatar_url: user.avatar_url || ""
            }
        });
    } catch (err) {
        console.error("Error updating profile:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports.updateEmail = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { new_email } = req.body;

        if (!new_email || !new_email.includes('@')) {
            return res.status(400).json({ message: "Email tidak valid" });
        }

        const user = await models.users.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        const existingEmail = await models.users.findOne({ where: { email: new_email } });
        if (existingEmail && existingEmail.id !== user.id) {
            return res.status(400).json({ message: "Email sudah terdaftar untuk akun lain" });
        }

        await user.update({ email: new_email });

        res.status(200).json({
            message: "Email berhasil diubah",
            data: {
                id: user.id,
                email: user.email
            }
        });
    } catch (err) {
        console.error("Error updating email:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
module.exports.resetPassword = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { new_password } = req.body;

        if (!new_password || new_password.length < 4) {
            return res.status(400).json({ message: "Password baru minimal 4 karakter" });
        }

        const user = await models.users.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        // Update password — hook beforeUpdate akan otomatis hash MD5
        await user.update({ password: new_password });

        res.status(200).json({
            message: "Password berhasil direset",
            data: {
                id: user.id,
                username: user.username,
                name: user.name
            }
        });
    } catch (err) {
        console.error("Error resetting password:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports.deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await models.users.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        // Check if user is an admin - maybe prevent deleting the last admin or something?
        // For now, just delete.
        
        await user.destroy();

        res.status(200).json({
            message: "User berhasil dihapus",
            data: { id }
        });
    } catch (err) {
        console.error("Error deleting user:", err);
        res.status(500).json({ 
            message: "Internal server error",
            error: err.message 
        });
    }
};
