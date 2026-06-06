const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

module.exports.uploadImage = async (req, res, next) => {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ message: "No files were uploaded." });
        }

        const image = req.files.image;

        // 1. Validasi File Extension & MIME Type (Keamanan Server)
        const ext = path.extname(image.name).toLowerCase();
        const mime = image.mimetype ? image.mimetype.toLowerCase() : '';

        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

        // Blokir file berbahaya (.php, .exe, .svg) dan dokumen (.pdf, office)
        const blockedExtensions = ['.php', '.exe', '.svg', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
        const isBlockedExt = blockedExtensions.includes(ext);

        const isOfficeOrPdfMime = mime === 'application/pdf' || 
            mime.startsWith('application/msword') || 
            mime.startsWith('application/vnd.ms-') || 
            mime.startsWith('application/vnd.openxmlformats-officedocument');

        const isAllowedMime = allowedMimeTypes.includes(mime);
        const isAllowedExt = allowedExtensions.includes(ext);

        if (isBlockedExt || isOfficeOrPdfMime || !isAllowedMime || !isAllowedExt) {
            return res.status(400).json({ message: "Format file tidak didukung atau dilarang demi keamanan sistem." });
        }
        
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
