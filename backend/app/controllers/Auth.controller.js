const { Op, Sequelize } = require('sequelize');
const jwt = require('jsonwebtoken');
const { hashPasswordWithMD5 } = require('../helpers/App.helper');
const sequelize = new Sequelize(process.env.DATABASE_URL);
const initModels = require('../database/init');
var models = initModels(sequelize);

module.exports.login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        const user = await models.users.findOne({
            where: {
                [Op.or]: [
                    { username: username },
                    { email: username } // check if the input matches email
                ]
            }
        });

        if (!user) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const isValid = await user.validPasswordMD5(password);

        if (!isValid) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const token = jwt.sign({
            id: user.id,
            username: user.username,
            role: user.role,
            level: 0 // Default for admin login if level not in model
        }, process.env.JWT_CONF_TOKEN, { expiresIn: '1d' });

        res.status(200).json({
            message: "Login successful",
            token: token,
            user: {
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
        console.error(err);
        next(err);
    }
}

module.exports.register = async (req, res, next) => {
    try {
        const { username, email, password, role } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: "Username, email, and password are required" });
        }

        if (password.length < 4) {
            return res.status(400).json({ message: "Password minimal 4 karakter" });
        }

        // Check if user already exists (including soft-deleted ones)
        const existingUser = await models.users.findOne({
            where: {
                [Op.or]: [
                    { username: username },
                    { email: email }
                ]
            },
            paranoid: false
        });

        if (existingUser) {
            return res.status(409).json({ message: "Username or email already exists" });
        }

        // Create new user
        const newUser = await models.users.create({
            username: username,
            email: email,
            password: password,
            role: role || 'pembeli', // default role
            name: username // use username as name by default
        });

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (err) {
        console.error(err);
        next(err);
    }
}

module.exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email wajib diisi" });
        }

        const user = await models.users.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: "Email tidak terdaftar di sistem kami" });
        }

        // Generate temporary password: 3 kata + 3 angka, mudah dibaca
        const words = ["Reptil", "Ular", "Gecko", "Iguana", "Kadal", "Buaya", "Kura"];
        const randomWord = words[Math.floor(Math.random() * words.length)];
        const randomNum = Math.floor(100 + Math.random() * 900); // 3 digit
        const tempPassword = `${randomWord}${randomNum}`;

        // Simpan password sementara ke DB (hook model akan auto-hash MD5)
        await user.update({ password: tempPassword });

        res.status(200).json({
            message: "Password sementara berhasil dibuat",
            temp_password: tempPassword,
            username: user.username
        });
    } catch (err) {
        console.error("Error forgot password:", err);
        next(err);
    }
}

module.exports.changePassword = async (req, res, next) => {
    try {
        const { id, current_password, new_password } = req.body;

        if (!id || !current_password || !new_password) {
            return res.status(400).json({ message: "Semua field wajib diisi" });
        }

        if (new_password.length < 6) {
            return res.status(400).json({ message: "Password baru minimal 6 karakter" });
        }

        const user = await models.users.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        // Validasi password lama
        const isValid = await user.validPasswordMD5(current_password);
        if (!isValid) {
            return res.status(401).json({ message: "Password saat ini tidak sesuai" });
        }

        // Simpan password baru (hook akan auto-hash MD5)
        await user.update({ password: new_password });

        res.status(200).json({ message: "Password berhasil diubah" });
    } catch (err) {
        console.error("Error change password:", err);
        next(err);
    }
}
