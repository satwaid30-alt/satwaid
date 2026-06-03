const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

module.exports.uploadImage = async (req, res, next) => {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ message: "No files were uploaded." });
        }

        const image = req.files.image;
        
        // Validate file size (Max 1MB)
        if (image.size > 1 * 1024 * 1024) {
            return res.status(400).json({ message: "Ukuran file tidak boleh melebihi 1MB" });
        }

        // Ensure upload directory exists
        const uploadDir = path.join(__dirname, '../../public/uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Generate unique filename
        const ext = path.extname(image.name);
        const filename = `${uuidv4()}${ext}`;
        const uploadPath = path.join(uploadDir, filename);

        // Use the mv() method to place the file on your server
        image.mv(uploadPath, (err) => {
            if (err) {
                return res.status(500).json({ message: err.message });
            }

            res.status(200).json({
                message: "File uploaded successfully",
                url: `/uploads/${filename}`
            });
        });
    } catch (err) {
        next(err);
    }
};
