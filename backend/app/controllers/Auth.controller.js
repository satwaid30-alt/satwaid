const { Op, Sequelize } = require('sequelize');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
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

        // Set HttpOnly cookie for JWT
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 1 hari
        });

        res.status(200).json({
            message: "Login successful",
            token: token, // keep sending token for backward compatibility
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

module.exports.logout = async (req, res, next) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        res.status(200).json({ message: "Logout successful" });
    } catch (err) {
        console.error("Error during logout:", err);
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

        // Generic success message to prevent email enumeration
        const genericSuccessMessage = "Jika email Anda terdaftar di sistem kami, instruksi reset password telah dikirim ke email Anda. Silakan periksa kotak masuk.";

        if (!user) {
            return res.status(200).json({ message: genericSuccessMessage });
        }

        // 1. Generate secure random token and hash it for DB storage
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const resetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 menit

        // 2. Simpan token ter-hash ke DB (Mencegah pencurian token via kebocoran DB)
        await user.update({
            reset_password_token: hashedToken,
            reset_password_expires: resetExpires
        });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

        // 3. Konfigurasi SMTP
        const mailHost = process.env.MAIL_HOST || 'smtp.gmail.com';
        const mailPort = parseInt(process.env.MAIL_PORT || '587');
        const mailUser = process.env.MAIL_USER;
        const mailPass = process.env.MAIL_PASS;
        const mailFrom = process.env.MAIL_FROM || '"Satwa iD Security" <no-reply@satwaid.com>';

        // Cek jika masih menggunakan placeholder default di .env (mode simulasi)
        const isDevSimulated = !mailUser || mailUser.includes('alamat_email_anda') || !mailPass || mailPass.includes('sandi_aplikasi_anda');

        if (isDevSimulated) {
            console.log("\n========================================================");
            console.log("🔒 [SIMULASI RESET PASSWORD SATWA ID]");
            console.log(`Untuk User: ${user.username} (${user.email})`);
            console.log(`Link Reset Password: ${resetUrl}`);
            console.log("========================================================\n");

            // Mencegah kebocoran token di API response pada mode dev/simulasi
            return res.status(200).json({ message: genericSuccessMessage });
        }

        // Kirim email asli via SMTP
        const transporter = nodemailer.createTransport({
            host: mailHost,
            port: mailPort,
            secure: mailPort === 465,
            auth: {
                user: mailUser,
                pass: mailPass
            }
        });

        const mailOptions = {
            from: mailFrom,
            to: user.email,
            subject: 'Permintaan Reset Password Akun Satwa iD',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #10b981;">Halo ${user.username || user.name},</h2>
                    <p>Kami menerima permintaan untuk melakukan reset password pada akun Satwa iD Anda.</p>
                    <p>Silakan klik tombol di bawah ini untuk mereset password Anda. Link ini hanya berlaku selama 15 menit:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #10b981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password Sekarang</a>
                    </div>
                    <p style="color: #666; font-size: 14px;">Jika tombol di atas tidak berfungsi, Anda juga dapat menyalin tautan berikut ke browser Anda:</p>
                    <p style="color: #10b981; word-break: break-all; font-size: 14px;">${resetUrl}</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="color: #999; font-size: 12px;">Jika Anda tidak meminta perubahan ini, abaikan saja email ini dan password Anda akan tetap aman.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: genericSuccessMessage });
    } catch (err) {
        console.error("Error forgot password:", err);
        next(err);
    }
}

module.exports.resetPassword = async (req, res, next) => {
    try {
        const { token, new_password } = req.body;

        if (!token || !new_password) {
            return res.status(400).json({ message: "Token dan password baru wajib diisi" });
        }

        if (new_password.length < 8) {
            return res.status(400).json({ message: "Password baru minimal 8 karakter demi keamanan" });
        }

        // Hash token yang masuk dari request untuk mencocokkan dengan hash di DB
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Cari user dengan token reset yang cocok dan belum kedaluwarsa
        const user = await models.users.findOne({
            where: {
                reset_password_token: hashedToken,
                reset_password_expires: {
                    [Op.gt]: new Date()
                }
            }
        });

        if (!user) {
            return res.status(400).json({ message: "Tautan reset tidak valid atau telah kedaluwarsa" });
        }

        // Simpan password baru (hook bcrypt otomatis aktif) & bersihkan token reset
        await user.update({
            password: new_password,
            reset_password_token: null,
            reset_password_expires: null
        });

        res.status(200).json({
            message: "Password berhasil diperbarui. Silakan login dengan password baru Anda."
        });
    } catch (err) {
        console.error("Error reset password:", err);
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
